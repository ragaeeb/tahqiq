'use client';

import { useMemo } from 'react';

import BookToolbar from '@/components/book-toolbar';
import JsonDropZone from '@/components/json-drop-zone';
import PageItem from '@/components/page-item';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import VersionFooter from '@/components/version-footer';
import { selectCurrentPages } from '@/stores/manuscriptStore/selectors';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

/**
 * Renders the main page layout for displaying manuscript pages.
 */
export default function Book() {
    const selectedVolume = useManuscriptStore((state) => state.selectedVolume);
    const urlTemplate = useManuscriptStore((state) => state.urlTemplate);
    const setUrlTemplate = useManuscriptStore((state) => state.setUrlTemplate);
    const isInitialized = selectedVolume > 0;
    const initManuscript = useManuscriptStore((state) => state.init);
    const pages = useManuscriptStore(selectCurrentPages);
    const selectAllPages = useManuscriptStore((state) => state.selectAllPages);

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
                            onFiles={initManuscript}
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
