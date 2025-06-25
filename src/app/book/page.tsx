'use client';

import { useEffect, useMemo } from 'react';

import type { Juz } from '@/stores/bookStore/types';

import JsonDropZone from '@/components/json-drop-zone';
import { Checkbox } from '@/components/ui/checkbox';
import VersionFooter from '@/components/version-footer';
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
    const isInitialized = selectedVolume > 0;
    const initBook = useBookStore((state) => state.init);
    const initFromManuscript = useBookStore((state) => state.initFromManuscript);
    const pages = useBookStore(selectCurrentPages);
    const selectAllPages = useBookStore((state) => state.selectAllPages);

    useEffect(() => {
        if (useManuscriptStore.getState().sheets.length > 0) {
            initFromManuscript(useManuscriptStore.getState());
        }
    }, [initFromManuscript]);

    const pageItems = useMemo(() => {
        return pages.map((page) => <PageItem key={`${selectedVolume}/${page.id}`} page={page} />);
    }, [pages, selectedVolume]);

    if (!isInitialized) {
        return (
            <>
                <div className="min-h-screen flex flex-col p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                    <div className="flex flex-col w-full max-w">
                        <JsonDropZone
                            allowedExtensions=".json"
                            description="Drag and drop the parts"
                            onFiles={(map) => initBook(map as unknown as Record<string, Juz>)}
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
                </div>
            </div>
            <VersionFooter />
        </>
    );
}
