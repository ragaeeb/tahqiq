'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useMemo, useRef, useState } from 'react';

import type { RawInputFiles, SheetLine } from '@/stores/manuscriptStore/types';

import JsonDropZone from '@/components/json-drop-zone';
import VersionFooter from '@/components/version-footer';
import { selectAllSheetLines } from '@/stores/manuscriptStore/selectors';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

import ManuscriptTableHeader from './table-header';
import TextRow from './text-row';
import Toolbar from './toolbar';

/**
 * Renders the main page layout for displaying manuscript pages.
 */
export default function Manuscript() {
    const initManuscript = useManuscriptStore((state) => state.init);
    const sheetLines = useManuscriptStore(selectAllSheetLines);
    const isInitialized = sheetLines.length > 0;
    const pagesFilter = useState<number[]>([]);
    const honorifics = useState(false);
    const selection = useState<SheetLine[]>([]);
    const [filterByPages] = pagesFilter;
    const [isHonorificsRowsOn] = honorifics;
    const [selectedRows, setSelectedRows] = selection;

    const rows = useMemo(() => {
        return sheetLines
            .filter((s) => filterByPages.length === 0 || filterByPages.includes(s.page))
            .filter((s) => (isHonorificsRowsOn ? s.includesHonorifics : true));
    }, [sheetLines, filterByPages, isHonorificsRowsOn]);

    const parentRef = useRef<HTMLDivElement>(null);

    // Calculate dynamic row height based on content
    const getItemSize = useCallback(
        (index: number) => {
            const row = rows[index];
            const previousRow = index > 0 ? rows[index - 1] : null;
            const isNewPage = previousRow && row.page !== previousRow.page;

            // Base height for a row
            let height = 60;

            // Add extra height for new page spacing
            if (isNewPage) {
                height += 32; // Extra spacing for new page
            }

            // Add extra height for footnotes (smaller text, might wrap more)
            if (row.isFootnote) {
                height += 10;
            }

            // Estimate height based on text length (rough approximation)
            const textLength = Math.max(row.text?.length || 0, row.alt?.length || 0);
            if (textLength > 100) {
                height += Math.ceil(textLength / 100) * 20;
            }

            return height;
        },
        [rows],
    );

    const virtualizer = useVirtualizer({
        count: rows.length,
        estimateSize: getItemSize,
        getScrollElement: () => parentRef.current,
        overscan: 5, // Render 5 extra items above/below viewport
    });

    const handleSelectionChange = useCallback(
        (item: SheetLine, selected: boolean) => {
            setSelectedRows((prev) => {
                if (selected) {
                    return [...prev, item];
                }

                return prev.filter((p) => p !== item);
            });
        },
        [setSelectedRows],
    );

    const handleSelectAll = (selected: boolean) => {
        setSelectedRows(selected ? rows : []);
    };

    if (!isInitialized) {
        return (
            <>
                <div className="min-h-screen flex flex-col p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                    <div className="flex flex-col w-full max-w">
                        <JsonDropZone
                            allowedExtensions=".json,.txt"
                            description="Drag and drop the manuscript"
                            maxFiles={4}
                            onFiles={(map) => {
                                initManuscript(map as unknown as RawInputFiles);
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
            <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
                <div className="flex flex-col w-full">
                    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
                        <Toolbar selection={selection} />
                        {selectedRows.length > 0 && (
                            <div className="text-sm text-gray-600">
                                {selectedRows.length} row{selectedRows.length !== 1 ? 's' : ''} selected
                            </div>
                        )}
                    </div>

                    <div className="w-full border-t border-gray-300">
                        {/* Fixed Header */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0 z-10">
                            <table className="w-full table-fixed">
                                <thead>
                                    <ManuscriptTableHeader
                                        honorifics={honorifics}
                                        onSelectAll={handleSelectAll}
                                        pagesFilter={pagesFilter}
                                        rows={rows}
                                        selectedRows={selectedRows}
                                    />
                                </thead>
                            </table>
                        </div>

                        {/* Virtualized Body */}
                        <div className="w-full overflow-auto" ref={parentRef} style={{ height: 'calc(100vh - 120px)' }}>
                            <div
                                style={{
                                    height: `${virtualizer.getTotalSize()}px`,
                                    position: 'relative',
                                    width: '100%',
                                }}
                            >
                                {virtualizer.getVirtualItems().map((virtualItem) => {
                                    const row = rows[virtualItem.index];

                                    return (
                                        <div
                                            key={virtualItem.key}
                                            style={{
                                                height: `${virtualItem.size}px`,
                                                left: 0,
                                                position: 'absolute',
                                                top: 0,
                                                transform: `translateY(${virtualItem.start}px)`,
                                                width: '100%',
                                            }}
                                        >
                                            <table className="w-full table-fixed">
                                                <tbody className="bg-white divide-y divide-gray-100">
                                                    <TextRow
                                                        data={row}
                                                        isNewPage={
                                                            virtualItem.index > 0
                                                                ? row.page !== rows[virtualItem.index - 1].page
                                                                : false
                                                        }
                                                        isSelected={selectedRows.includes(row)}
                                                        onSelectionChange={handleSelectionChange}
                                                    />
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <VersionFooter />
        </>
    );
}
