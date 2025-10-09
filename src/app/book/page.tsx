'use client';

import { record } from 'nanolytics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import JsonDropZone from '@/components/json-drop-zone';
import { Checkbox } from '@/components/ui/checkbox';
import VersionFooter from '@/components/version-footer';
import type { Kitab, Page } from '@/stores/bookStore/types';
import type { Juz } from '@/stores/manuscriptStore/types';
import '@/lib/analytics';
import { selectCurrentPages } from '@/stores/bookStore/selectors';
import { useBookStore } from '@/stores/bookStore/useBookStore';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

import BookToolbar from './book-toolbar';
import PageItem from './page-item';
import PageToolbar from './page-toolbar';

/**
 * Renders the main page layout for displaying manuscript pages.
 */
export default function Book() {
    const selectedVolume = useBookStore((state) => state.selectedVolume);
    const isInitialized = selectedVolume > 0;
    const initBook = useBookStore((state) => state.init);
    const initFromManuscript = useBookStore((state) => state.initFromManuscript);
    const deletePages = useBookStore((state) => state.deletePages);
    const reformatPages = useBookStore((state) => state.reformatPages);
    const mergeFootnotesWithMatn = useBookStore((state) => state.mergeFootnotesWithMatn);
    const pages = useBookStore(selectCurrentPages);
    const [selectedPages, setSelectedPages] = useState<Page[]>([]);

    useEffect(() => {
        if (useManuscriptStore.getState().sheets.length > 0) {
            initFromManuscript(useManuscriptStore.getState());
        }
    }, [initFromManuscript]);

    const handleSelectionChange = useCallback((item: Page, selected: boolean) => {
        setSelectedPages((prev) => {
            if (selected) {
                return [...prev, item];
            }

            return prev.filter((p) => p !== item);
        });
    }, []);

    const blankPages = useMemo(() => {
        return pages.filter((p) => !p.footnotes && !p.text);
    }, [pages]);

    const pageItems = useMemo(() => {
        return pages.map((page) => (
            <PageItem
                isSelected={selectedPages.includes(page)}
                key={`${selectedVolume}/${page.id}`}
                onSelectionChange={handleSelectionChange}
                page={page}
            />
        ));
    }, [pages, selectedVolume, selectedPages, handleSelectionChange]);

    const onReformatSelectedPages = useCallback(() => {
        record('ReformatPages', selectedPages.length.toString());
        reformatPages(selectedPages.map((p) => p.id));
        setSelectedPages([]);
    }, [reformatPages, selectedPages]);

    const onDeleteSelectedPages = useCallback(() => {
        record('DeletePagesFromBook', selectedPages.length.toString());
        deletePages(selectedPages.map((p) => p.id));
        setSelectedPages([]);
    }, [deletePages, selectedPages]);

    const onMergeFootnotes = useCallback(() => {
        record('MergeFootnotes', selectedPages.length.toString());
        mergeFootnotesWithMatn(selectedPages.map((p) => p.id));
        setSelectedPages([]);
    }, [mergeFootnotesWithMatn, selectedPages]);

    const onSelectEmptyPages = useCallback(() => {
        record('SelectEmptyPages', blankPages.length.toString());
        setSelectedPages(blankPages);
    }, [blankPages]);

    if (!isInitialized) {
        return (
            <>
                <div className="flex min-h-screen flex-col p-8 font-[family-name:var(--font-geist-sans)] sm:p-20">
                    <div className="max-w flex w-full flex-col">
                        <JsonDropZone
                            allowedExtensions=".json"
                            description="Drag and drop the parts"
                            onFiles={(map) => {
                                record('InitBookFromJuz', Object.keys(map).toString());
                                initBook(map as unknown as Record<string, Juz | Kitab>);
                            }}
                        />
                    </div>
                </div>
                <VersionFooter />
            </>
        );
    }

    const arePagesSelected = selectedPages.length > 0;

    return (
        <>
            <div className="flex min-h-screen flex-col p-8 font-[family-name:var(--font-geist-sans)] sm:p-20">
                <div className="max-w flex w-full flex-col">
                    <div className="sticky top-0 z-20 flex items-center justify-between border-gray-200 border-b bg-white px-4 py-2">
                        <BookToolbar
                            onDeleteSelectedPages={arePagesSelected ? onDeleteSelectedPages : undefined}
                            onMergeFootnotes={arePagesSelected ? onMergeFootnotes : undefined}
                            onReformatSelectedPages={arePagesSelected ? onReformatSelectedPages : undefined}
                            onSelectEmptyPages={
                                blankPages.length && !selectedPages.length ? onSelectEmptyPages : undefined
                            }
                        />
                    </div>

                    <div className="overflow-auto rounded border">
                        <table className="w-full table-auto divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="w-8 px-2 py-1 text-left">
                                        <Checkbox
                                            aria-label="Select all pages"
                                            checked={selectedPages.length === pages.length && pages.length > 0}
                                            onCheckedChange={(isSelected) => {
                                                record(isSelected ? 'SelectAllPages' : 'ClearAllPages');
                                                setSelectedPages(isSelected ? pages : []);
                                            }}
                                        />
                                    </th>
                                    <th aria-label="Page" className="w-36 px-2 py-1 text-left">
                                        ID
                                    </th>
                                    <th aria-label="Page" className="w-36 px-2 py-1 text-left">
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
            <PageToolbar />
            <VersionFooter />
        </>
    );
}
