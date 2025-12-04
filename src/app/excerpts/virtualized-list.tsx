'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useCallback, useRef, useState } from 'react';

type VirtualizedListProps<T> = {
    data: T[];
    estimateSize?: (index: number) => number;
    getKey: (item: T, index: number) => string | number;
    header: React.ReactNode;
    renderRow: (item: T, index: number) => React.ReactNode;
};

// Height of the sticky table header in pixels
const HEADER_HEIGHT = 44;

function VirtualizedList<T>({ data, estimateSize, getKey, header, renderRow }: VirtualizedListProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(HEADER_HEIGHT);

    // Increased default estimate to accommodate larger content
    const defaultEstimateSize = useCallback(() => 150, []);

    const virtualizer = useVirtualizer({
        count: data.length,
        estimateSize: estimateSize ?? defaultEstimateSize,
        getScrollElement: () => parentRef.current,
        measureElement:
            typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
                ? (element) => element.getBoundingClientRect().height
                : undefined,
        overscan: 5,
    });

    const headerRef = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            setHeaderHeight(node.getBoundingClientRect().height);
        }
    }, []);

    return (
        <div className="w-full overflow-auto" ref={parentRef} style={{ height: 'calc(100vh - 105px)' }}>
            <div
                style={{
                    height: `${virtualizer.getTotalSize() + headerHeight}px`,
                    position: 'relative',
                    width: '100%',
                }}
            >
                <div className="sticky top-0 z-10 bg-white shadow-sm" ref={headerRef}>
                    <table className="w-full table-fixed border-collapse">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">{header}</thead>
                    </table>
                </div>
                {virtualizer.getVirtualItems().map((virtualItem) => {
                    const item = data[virtualItem.index];

                    return (
                        <div
                            key={getKey(item, virtualItem.index)}
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                            style={{
                                left: 0,
                                position: 'absolute',
                                top: `${virtualItem.start + headerHeight}px`,
                                width: '100%',
                            }}
                        >
                            <table className="w-full table-fixed border-collapse">
                                <tbody className="bg-white">{renderRow(item, virtualItem.index)}</tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default React.memo(VirtualizedList) as typeof VirtualizedList;
