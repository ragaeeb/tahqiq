'use client';

import { useEffect, useMemo } from 'react';

import type { Book as BookType } from '@/stores/bookStore/types';

import JsonDropZone from '@/components/json-drop-zone';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import VersionFooter from '@/components/version-footer';
import { mapManuscriptToBook } from '@/lib/legacy';
import { selectCurrentPages } from '@/stores/bookStore/selectors';
import { useBookStore } from '@/stores/bookStore/useBookStore';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

import BookToolbar from './book-toolbar';
import PageItem from './page-item';

/**
 * Renders the main page layout for displaying manuscript pages.
 */
export default function Book() {
    const selectedVolume = useBookStore((state) => state.selectedVolume);
    const urlTemplate = useBookStore((state) => state.urlTemplate);
    const setUrlTemplate = useBookStore((state) => state.setUrlTemplate);
    const isInitialized = selectedVolume > 0;
    const initBook = useBookStore((state) => state.init);
    const pages = useBookStore(selectCurrentPages);
    const selectAllPages = useBookStore((state) => state.selectAllPages);

    useEffect(() => {
        if (useManuscriptStore.getState().sheets.length > 0) {
            const book = mapManuscriptToBook(useManuscriptStore.getState());
            initBook({ '1.json': book });
        }
    }, [initBook]);

    const pageItems = useMemo(() => {
        return pages.map((page) => <PageItem key={`${selectedVolume}/${page.id}`} page={page} />);
    }, [pages, selectedVolume]);

    if (!isInitialized) {
        return (
            <>
                <div className="min-h-screen flex flex-col p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                    <div className="flex flex-col w-full max-w">
                        <JsonDropZone
                            allowedExtensions=".json,.txt"
                            description="Drag and drop the manuscript"
                            maxFiles={4}
                            onFiles={(map) => initBook(map as unknown as Record<string, BookType>)}
                        />
                    </div>
                </div>
                <VersionFooter />
            </>
        );
    }

    return (
        <>
            <div className="min-h-screen flex flex-col p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                <div className="flex flex-col w-full max-w">
                    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                        <BookToolbar />
                    </div>

                    <div className="overflow-auto border rounded">
                        <table className="w-full table-auto divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2 py-1 w-8 text-left">
                                        <Checkbox
                                            aria-label="Select all pages"
                                            onCheckedChange={(isSelected) => selectAllPages(Boolean(isSelected))}
                                        />
                                    </th>
                                    <th aria-label="Page" className="px-2 py-1 w-36 text-left">
                                        ID
                                    </th>
                                    <th aria-label="Page" className="px-2 py-1 w-36 text-left">
                                        Page
                                    </th>
                                    <th aria-label="Text" className="px-4 py-1 text-right">
                                        Text
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">{pageItems}</tbody>
                        </table>
                    </div>
                    <div className="mt-4 p-4 border rounded">
                        <label className="block text-sm font-medium mb-2" htmlFor="url-template">
                            URL Template
                        </label>
                        <Input
                            defaultValue={urlTemplate}
                            id="url-template"
                            onBlur={(e) => setUrlTemplate(e.target.value)}
                            placeholder="Enter URL template for manuscript pages"
                        />
                    </div>
                </div>
            </div>
            <VersionFooter />
        </>
    );
}
