'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

type VirtualizedListProps<T> = {
    data: T[];
    estimateSize?: (index: number) => number;
    /** Optional custom function to find the index to scroll to. If not provided, uses getKey to match scrollToId. */
    findScrollIndex?: (data: T[], scrollToId: string | number) => number;
    getKey: (item: T, index: number) => string | number;
    header: React.ReactNode;
    renderRow: (item: T, index: number) => React.ReactNode;
    /** ID or value to scroll to - will find the item using findScrollIndex or getKey and scroll to it */
    scrollToId?: string | number | null;
    /** Callback when scroll-to is complete */
    onScrollToComplete?: () => void;
    /** Optional override for the scroll container height (defaults to full-page layout). */
    height?: string;
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
    findScrollIndex,
    getKey,
    header,
    initialScrollTop,
    onScrollToComplete,
    parentRef,
    renderRow,
    scrollToId,
}: VirtualizerContentProps<T>) {
    const [headerHeight, setHeaderHeight] = useState(HEADER_HEIGHT);
    const hasScrolledToIdRef = useRef<string | number | null>(null);
    const dataRef = useRef(data);
    const estimateSizeRef = useRef(estimateSize);
    const findScrollIndexRef = useRef(findScrollIndex);
    const getKeyRef = useRef(getKey);

    useEffect(() => {
        dataRef.current = data;
        estimateSizeRef.current = estimateSize;
        findScrollIndexRef.current = findScrollIndex;
        getKeyRef.current = getKey;
    }, [data, estimateSize, findScrollIndex, getKey]);

    // Increased default estimate to accommodate larger content
    const defaultEstimateSize = useCallback(() => 150, []);

    const estimateSizeFn = useCallback(
        (index: number) => estimateSizeRef.current?.(index) ?? defaultEstimateSize(),
        [defaultEstimateSize],
    );
    const getItemKey = useCallback((index: number) => getKeyRef.current(dataRef.current[index], index), []);
    const getScrollElement = useCallback(() => parentRef.current, [parentRef]);
    const measureElement = useMemo(() => {
        if (typeof window === 'undefined' || navigator.userAgent.indexOf('Firefox') !== -1) {
            return undefined;
        }
        return (element: Element) => element.getBoundingClientRect().height;
    }, []);

    const virtualizer = useVirtualizer(
        useMemo(
            () => ({
                count: data.length,
                estimateSize: estimateSizeFn,
                getItemKey,
                getScrollElement,
                // Initialize with the saved scroll offset to prevent flash
                initialOffset: initialScrollTop,
                measureElement,
                overscan: 5,
            }),
            [data.length, estimateSizeFn, getItemKey, getScrollElement, initialScrollTop, measureElement],
        ),
    );

    // Restore scroll position synchronously before paint
    useLayoutEffect(() => {
        if (parentRef.current && initialScrollTop > 0) {
            parentRef.current.scrollTop = initialScrollTop;
        }
    }, [parentRef, initialScrollTop]);

    // Scroll to the specified ID when it changes
    useEffect(() => {
        if (scrollToId != null && scrollToId !== hasScrolledToIdRef.current) {
            // Find the index - use custom finder if provided, otherwise match by key
            const index = findScrollIndexRef.current
                ? findScrollIndexRef.current(data, scrollToId)
                : data.findIndex((item, i) => getKeyRef.current(item, i) === scrollToId);
            if (index !== -1) {
                hasScrolledToIdRef.current = scrollToId;

                // Use setTimeout to ensure the virtualizer is ready after tab switch
                setTimeout(() => {
                    // For dynamic sizes, use 'auto' behavior as 'smooth' doesn't work reliably
                    // Also calculate the estimated offset as a fallback
                    const estimatedOffset = index * (estimateSizeRef.current?.(index) ?? 150);

                    // Try scrollToIndex first with 'auto' behavior
                    virtualizer.scrollToIndex(index, { align: 'start', behavior: 'auto' });

                    // As additional insurance, also set scrollTop directly after a brief delay
                    // This handles cases where scrollToIndex may not work with unmeasured items
                    setTimeout(() => {
                        if (parentRef.current) {
                            const currentOffset = virtualizer.getOffsetForIndex(index, 'start');
                            if (currentOffset != null) {
                                parentRef.current.scrollTop = currentOffset[0];
                            } else {
                                // Fallback to estimated offset if getOffsetForIndex fails
                                parentRef.current.scrollTop = estimatedOffset;
                            }
                        }
                        onScrollToComplete?.();
                    }, 50);
                }, 100);
            }
        } else if (scrollToId == null) {
            hasScrolledToIdRef.current = null;
        }
    }, [scrollToId, data, virtualizer, onScrollToComplete, parentRef]);

    const headerRef = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            const nextHeight = node.getBoundingClientRect().height;
            setHeaderHeight((prev) => (prev === nextHeight ? prev : nextHeight));
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
function VirtualizedList<T>({
    data,
    estimateSize,
    findScrollIndex,
    getKey,
    header,
    onScrollToComplete,
    renderRow,
    scrollToId,
    height,
}: VirtualizedListProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);
    const scrollTopRef = useRef(0);
    const prevDataVersionRef = useRef<string>('');
    const getKeyRef = useRef(getKey);
    // Track the first visible item's key for scroll restoration after data changes
    const firstVisibleKeyRef = useRef<string | number | null>(null);
    const [restoreScrollToKey, setRestoreScrollToKey] = useState<string | number | null>(null);

    useEffect(() => {
        getKeyRef.current = getKey;
    }, [getKey]);

    const getKeyStable = useCallback((item: T, index: number) => getKeyRef.current(item, index), []);

    // Create a stable key based on structural changes (add/remove) - not all keys
    // This avoids unnecessary remounts for content-only updates
    const dataVersion = useMemo(() => {
        const first = data[0] ? getKeyStable(data[0], 0) : '';
        const last = data.at(-1) ? getKeyStable(data.at(-1)!, data.length - 1) : '';
        return `${data.length}-${first}-${last}`;
    }, [data, getKeyStable]);

    // Handle scroll restoration when data version changes
    useEffect(() => {
        if (prevDataVersionRef.current !== '' && prevDataVersionRef.current !== dataVersion) {
            if (firstVisibleKeyRef.current != null) {
                const keyExists = data.some((item, i) => getKeyStable(item, i) === firstVisibleKeyRef.current);
                if (keyExists) {
                    setRestoreScrollToKey(firstVisibleKeyRef.current);
                }
            }
        }
        prevDataVersionRef.current = dataVersion;
    }, [dataVersion, data, getKeyStable]);

    // Save scroll position and first visible item continuously
    const handleScroll = useCallback(() => {
        if (parentRef.current) {
            scrollTopRef.current = parentRef.current.scrollTop;

            // Find the first visible item by checking which item is at the current scroll position
            // The items are positioned absolutely, so we look for an item that starts near scrollTop
            const scrollTop = parentRef.current.scrollTop;

            // Find the first item that's visible (its top is at or before scrollTop + headerHeight)
            for (let i = 0; i < data.length; i++) {
                const estimatedOffset = i * (estimateSize?.(i) ?? 150);
                if (estimatedOffset + (estimateSize?.(i) ?? 150) > scrollTop - HEADER_HEIGHT) {
                    const key = getKeyStable(data[i], i);
                    if (firstVisibleKeyRef.current !== key) {
                        firstVisibleKeyRef.current = key;
                    }
                    break;
                }
            }
        }
    }, [data, estimateSize, getKeyStable]);

    // Clear restoration state after it's been used
    const handleRestoreComplete = useCallback(() => {
        setRestoreScrollToKey(null);
        onScrollToComplete?.();
    }, [onScrollToComplete]);

    // Determine which scrollToId to use - user-provided takes precedence, then restoration
    const effectiveScrollToId = scrollToId ?? restoreScrollToKey;

    return (
        <div
            className="w-full overflow-auto"
            onScroll={handleScroll}
            ref={parentRef}
            style={{ height: height ?? 'calc(100vh - 105px)' }}
        >
            <VirtualizerContent
                key={dataVersion}
                data={data}
                estimateSize={estimateSize}
                findScrollIndex={findScrollIndex}
                getKey={getKeyStable}
                header={header}
                initialScrollTop={scrollTopRef.current}
                onScrollToComplete={handleRestoreComplete}
                parentRef={parentRef}
                renderRow={renderRow}
                scrollToId={effectiveScrollToId}
            />
        </div>
    );
}

export default React.memo(VirtualizedList) as typeof VirtualizedList;
