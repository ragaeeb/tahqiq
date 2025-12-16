'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ShamelaPage, ShamelaTitle } from '@/stores/shamelaStore/types';
import { useShamelaStore } from '@/stores/shamelaStore/useShamelaStore';

export type FilterField = 'content' | 'id';
export type FilterScope = 'pages' | 'titles';

type Filters = { content: string; id: string };

/**
 * Generic filter function for items with id and a content field.
 * Consolidates the common filtering logic used by pages and titles.
 */
function filterItems<T extends { id: number }>(items: T[], filters: Filters, getContent: (item: T) => string): T[] {
    return items.filter((item) => {
        if (filters.id) {
            const idNum = Number.parseInt(filters.id, 10);
            if (!Number.isNaN(idNum) && item.id !== idNum) {
                return false;
            }
        }
        if (filters.content && !getContent(item).includes(filters.content)) {
            return false;
        }
        return true;
    });
}

const filterPages = (items: ShamelaPage[], filters: Filters) => filterItems(items, filters, (item) => item.body);

const filterTitles = (items: ShamelaTitle[], filters: Filters) => filterItems(items, filters, (item) => item.content);

/**
 * Hook to manage URL-based filtering for shamela pages and titles.
 * Persists filter queries in URL search params for refresh-persistence and shareability.
 *
 * URL format: ?tab=pages&content=pattern&id=50#123 (where #123 scrolls to item with id 123)
 */
export function useShamelaFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Get store data and filter actions
    const allPages = useShamelaStore((state) => state.pages);
    const allTitles = useShamelaStore((state) => state.titles);
    const filterPagesByIds = useShamelaStore((state) => state.filterPagesByIds);
    const filterTitlesByIds = useShamelaStore((state) => state.filterTitlesByIds);

    // Read current tab and filter values from URL
    const activeTab = (searchParams.get('tab') as FilterScope) || 'pages';
    const filters = useMemo(
        () => ({ content: searchParams.get('content') || '', id: searchParams.get('id') || '' }),
        [searchParams],
    );

    // Read scroll target from URL hash (e.g., #123)
    // We need to use state since window.location.hash isn't available during SSR
    const [scrollToId, setScrollToId] = useState<number | null>(null);

    // Read hash on mount and listen for hashchange events
    useEffect(() => {
        const readHash = () => {
            const hash = window.location.hash.slice(1); // Remove the # prefix
            if (hash) {
                const id = Number.parseInt(hash, 10);
                if (!Number.isNaN(id)) {
                    setScrollToId(id);
                    return;
                }
            }
            setScrollToId(null);
        };

        // Read initial hash on mount
        readHash();

        // Listen for hash changes (e.g., browser back/forward)
        window.addEventListener('hashchange', readHash);
        return () => window.removeEventListener('hashchange', readHash);
    }, []);

    // Track if filters have been applied for current URL params + data state
    const prevFiltersRef = useRef<string>('');
    const filtersKey = `${activeTab}:${filters.content}:${filters.id}`;

    // Track data loading state - we need to reapply filters when data first loads
    const dataLoadedRef = useRef(false);
    const hasData = allPages.length > 0 || allTitles.length > 0;

    // Update URL with new tab
    const setActiveTab = useCallback(
        (tab: FilterScope) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', tab);
            // Clear filters when switching tabs
            params.delete('content');
            params.delete('id');
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [searchParams, router, pathname],
    );

    // Update URL with new filter value
    const setFilter = useCallback(
        (field: FilterField, value: string) => {
            const params = new URLSearchParams(searchParams.toString());

            if (value) {
                params.set(field, value);
            } else {
                params.delete(field);
            }

            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [searchParams, router, pathname],
    );

    /**
     * Navigate to a specific tab and scroll to a particular item by ID.
     * Uses URL hash for the scroll target (e.g., ?tab=pages#123)
     */
    const navigateToItem = useCallback(
        (tab: FilterScope, itemId: number) => {
            setScrollToId(itemId);

            const params = new URLSearchParams();
            params.set('tab', tab);

            // Try to use router's callback if available
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });

            // Queue hash update for next tick to ensure router navigation completes
            // Consider using router.events if available for more reliable timing
            requestAnimationFrame(() => {
                const currentUrl = new URL(window.location.href);
                currentUrl.hash = itemId.toString();
                window.history.replaceState(window.history.state, '', currentUrl.toString());
            });
        },
        [pathname, router],
    );

    /**
     * Clear the scrollTo state after scrolling is complete.
     * The hash remains in the URL for shareability.
     */
    const clearScrollTo = useCallback(() => {
        if (scrollToId) {
            setScrollToId(null);
            // Note: We intentionally keep the hash in the URL for shareability
            // Users can copy the URL and share it, and it will scroll to the same item
        }
    }, [scrollToId]);

    // Helper to apply filters to the active tab
    const applyFiltersToTab = useCallback(() => {
        if (activeTab === 'pages') {
            const filtered = filterPages(allPages, filters);
            filterPagesByIds(filtered.map((p) => p.id));
            filterTitlesByIds(undefined);
        } else {
            const filtered = filterTitles(allTitles, filters);
            filterTitlesByIds(filtered.map((t) => t.id));
            filterPagesByIds(undefined);
        }
    }, [activeTab, allPages, allTitles, filters, filterPagesByIds, filterTitlesByIds]);

    // Apply filters when URL params change OR when data is first loaded
    useEffect(() => {
        const hasFilters = filters.content || filters.id;
        const isDataLoadEvent = !dataLoadedRef.current && hasData;

        if (isDataLoadEvent) {
            dataLoadedRef.current = true;
        }

        const filtersChanged = prevFiltersRef.current !== filtersKey;
        if (!filtersChanged && !isDataLoadEvent) {
            return;
        }

        prevFiltersRef.current = filtersKey;

        if (!hasFilters) {
            filterPagesByIds(undefined);
            filterTitlesByIds(undefined);
            return;
        }

        if (hasData) {
            applyFiltersToTab();
        }
    }, [filtersKey, hasData, filters, applyFiltersToTab, filterPagesByIds, filterTitlesByIds]);

    return { activeTab, clearScrollTo, filters, navigateToItem, scrollToId, setActiveTab, setFilter };
}
