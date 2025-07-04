'use client';

import { replaceLineBreaksWithSpaces } from 'bitaboom';
import { FormattingToolbar } from 'blumbaben';
import { CurlyBracesIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Juz, Kitab, Page } from '@/stores/bookStore/types';

import JsonDropZone from '@/components/json-drop-zone';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import VersionFooter from '@/components/version-footer';
import { fixUnbalanced, preformatArabicText } from '@/lib/textUtils';
import { selectCurrentPages } from '@/stores/bookStore/selectors';
import { useBookStore } from '@/stores/bookStore/useBookStore';
import '@/lib/analytics';
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
    }, [reformatPages, selectedPages]);

    const onDeleteSelectedPages = useCallback(() => {
        record('DeletePagesFromBook', selectedPages.length.toString());
        deletePages(selectedPages.map((p) => p.id));
    }, [deletePages, selectedPages]);

    const onMergeFootnotes = useCallback(() => {
        record('MergeFootnotes', selectedPages.length.toString());
        mergeFootnotesWithMatn(selectedPages.map((p) => p.id));
    }, [mergeFootnotesWithMatn, selectedPages]);

    if (!isInitialized) {
        return (
            <>
                <div className="min-h-screen flex flex-col p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                    <div className="flex flex-col w-full max-w">
                        <JsonDropZone
                            allowedExtensions=".json"
                            description="Drag and drop the parts"
                            onFiles={(map) => {
                                record('InitBookFromJuz');
                                initBook(map as unknown as Record<string, Juz | Kitab>);
                            }}
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
                        <BookToolbar
                            onDeleteSelectedPages={selectedPages.length > 0 ? onDeleteSelectedPages : undefined}
                            onMergeFootnotes={selectedPages.length > 0 ? onMergeFootnotes : undefined}
                            onReformatSelectedPages={selectedPages.length > 0 ? onReformatSelectedPages : undefined}
                        />
                    </div>

                    <div className="overflow-auto border rounded">
                        <table className="w-full table-auto divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2 py-1 w-8 text-left">
                                        <Checkbox
                                            aria-label="Select all pages"
                                            checked={selectedPages.length === pages.length && pages.length > 0}
                                            onCheckedChange={(isSelected) => {
                                                record(isSelected ? 'SelectAllPages' : 'ClearAllPages');
                                                setSelectedPages(isSelected ? pages : []);
                                            }}
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
            <FormattingToolbar>
                {(applyFormat) => (
                    <>
                        <Button
                            key="replaceLineBreaksWithSpaces"
                            onClick={() => {
                                record('FormatToolBar', 'lineBreaksToSpaces');
                                applyFormat(replaceLineBreaksWithSpaces);
                            }}
                            variant="outline"
                        >
                            ↩̶
                        </Button>
                        <Button
                            key="reformat"
                            onClick={() => {
                                record('Reformat');
                                applyFormat(preformatArabicText);
                            }}
                        >
                            Reformat
                        </Button>
                        <Button
                            key="fixUnbalanced"
                            onClick={() => {
                                record('FixUnbalanced');
                                applyFormat(fixUnbalanced);
                            }}
                        >
                            <CurlyBracesIcon />
                        </Button>
                    </>
                )}
            </FormattingToolbar>
            <VersionFooter />
        </>
    );
}
