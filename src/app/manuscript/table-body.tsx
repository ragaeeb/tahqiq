'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useCallback, useRef } from 'react';

import type { SheetLine } from '@/stores/manuscriptStore/types';

import TextRow from './text-row';

type ManuscriptTableBodyProps = {
    onSelectionChange: (row: SheetLine, selected: boolean, isShiftPressed: boolean) => void;
    previewPdf: (page: number) => void;
    rows: SheetLine[];
    selectedRows: SheetLine[];
};

function ManuscriptTableBody({ onSelectionChange, previewPdf, rows, selectedRows }: ManuscriptTableBodyProps) {
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

    return (
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
                                        onSelectionChange={onSelectionChange}
                                        previewPdf={previewPdf}
                                    />
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default React.memo(ManuscriptTableBody);
