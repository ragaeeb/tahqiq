'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

type VirtualizedListProps<T> = {
    data: T[];
    estimateSize?: (index: number) => number;
    getKey: (item: T, index: number) => string | number;
    header: React.ReactNode;
    renderRow: (item: T, index: number) => React.ReactNode;
};

// Height of the sticky table header in pixels
const HEADER_HEIGHT = 44;

type VirtualizerContentProps<T> = VirtualizedListProps<T> & {
    initialScrollTop: number;
    parentRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Inner component that contains the virtualizer.
 * This is remounted when data structure changes to clear measurement cache.
 */
function VirtualizerContent<T>({
    data,
    estimateSize,
    getKey,
    header,
    initialScrollTop,
    parentRef,
    renderRow,
}: VirtualizerContentProps<T>) {
    const [headerHeight, setHeaderHeight] = useState(HEADER_HEIGHT);

    // Increased default estimate to accommodate larger content
    const defaultEstimateSize = useCallback(() => 150, []);

    const virtualizer = useVirtualizer({
        count: data.length,
        estimateSize: estimateSize ?? defaultEstimateSize,
        getItemKey: (index) => getKey(data[index], index),
        getScrollElement: () => parentRef.current,
        // Initialize with the saved scroll offset to prevent flash
        initialOffset: initialScrollTop,
        measureElement:
            typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
                ? (element) => element.getBoundingClientRect().height
                : undefined,
        overscan: 5,
    });

    // Restore scroll position synchronously before paint
    useLayoutEffect(() => {
        if (parentRef.current && initialScrollTop > 0) {
            parentRef.current.scrollTop = initialScrollTop;
        }
    }, [parentRef, initialScrollTop]);

    const headerRef = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            setHeaderHeight(node.getBoundingClientRect().height);
        }
    }, []);

    const virtualItems = virtualizer.getVirtualItems();

    return (
        <div style={{ height: `${virtualizer.getTotalSize() + headerHeight}px`, position: 'relative', width: '100%' }}>
            <div className="sticky top-0 z-10 bg-white shadow-sm" ref={headerRef}>
                <table className="w-full table-fixed border-collapse">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">{header}</thead>
                </table>
            </div>
            {virtualItems.map((virtualItem) => {
                const item = data[virtualItem.index];
                const key = getKey(item, virtualItem.index);

                return (
                    <div
                        key={key}
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
    );
}

/**
 * Virtualized list component that maintains scroll position across data changes
 * while ensuring measurement cache is cleared.
 */
function VirtualizedList<T>({ data, estimateSize, getKey, header, renderRow }: VirtualizedListProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);
    const scrollTopRef = useRef(0);
    const prevDataVersionRef = useRef<string>('');

    // Create a stable key based on structural changes (add/remove) - not all keys
    // This avoids unnecessary remounts for content-only updates
    const dataVersion = useMemo(() => {
        const first = data[0] ? getKey(data[0], 0) : '';
        const last = data.at(-1) ? getKey(data.at(-1)!, data.length - 1) : '';
        return `${data.length}-${first}-${last}`;
    }, [data, getKey]);

    // Capture scroll position before component remounts due to data change
    // This runs during render (before commit phase)
    if (prevDataVersionRef.current !== dataVersion && parentRef.current) {
        scrollTopRef.current = parentRef.current.scrollTop;
    }
    prevDataVersionRef.current = dataVersion;

    // Save scroll position continuously
    const handleScroll = useCallback(() => {
        if (parentRef.current) {
            scrollTopRef.current = parentRef.current.scrollTop;
        }
    }, []);

    return (
        <div
            className="w-full overflow-auto"
            onScroll={handleScroll}
            ref={parentRef}
            style={{ height: 'calc(100vh - 105px)' }}
        >
            <VirtualizerContent
                key={dataVersion}
                data={data}
                estimateSize={estimateSize}
                getKey={getKey}
                header={header}
                initialScrollTop={scrollTopRef.current}
                parentRef={parentRef}
                renderRow={renderRow}
            />
        </div>
    );
}

export default React.memo(VirtualizedList) as typeof VirtualizedList;
