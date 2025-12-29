'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createMatcher } from '@/lib/search';
import type { KetabPage, KetabTitle } from '@/stores/ketabStore/types';
import { useKetabStore } from '@/stores/ketabStore/useKetabStore';

export type FilterField = 'body' | 'page' | 'title';
export type FilterScope = 'pages' | 'titles';

type Filters = { body: string; page: string; title: string };

/**
 * Generic filter function for items with id and a content field.
 * Consolidates the common filtering logic used by pages and titles.
 */
function filterItems<T extends { id: number }>(
    items: T[],
    pageFilter: string,
    contentFilter: string,
    getContent: (item: T) => string,
    getPage: (item: T) => number,
): T[] {
    const contentMatcher = contentFilter ? createMatcher(contentFilter) : null;

    return items.filter((item) => {
        if (pageFilter) {
            const pageNum = Number.parseInt(pageFilter, 10);
            if (!Number.isNaN(pageNum) && getPage(item) !== pageNum) {
                return false;
            }
        }
        if (contentMatcher && !contentMatcher(getContent(item))) {
            return false;
        }
        return true;
    });
}

const filterPages = (items: KetabPage[], filters: Filters) =>
    filterItems(
        items,
        filters.page,
        filters.body,
        (item) => item.body,
        (item) => item.page,
    );

const filterTitles = (items: KetabTitle[], filters: Filters) =>
    filterItems(
        items,
        filters.page,
        filters.title,
        (item) => item.title,
        (item) => item.page,
    );

/**
 * Hook to manage URL-based filtering for ketab pages and titles.
 * Persists filter queries in URL search params for refresh-persistence and shareability.
 *
 * URL format: ?tab=pages&body=pattern&page=50#123 (where #123 scrolls to item with id 123)
 */
export function useKetabFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Get store data and filter actions
    const allPages = useKetabStore((state) => state.pages);
    const allTitles = useKetabStore((state) => state.titles);
    const filterPagesByIds = useKetabStore((state) => state.filterPagesByIds);
    const filterTitlesByIds = useKetabStore((state) => state.filterTitlesByIds);

    // Read current tab and filter values from URL
    const activeTab = (searchParams.get('tab') as FilterScope) || 'pages';
    const filters = useMemo(
        () => ({
            body: searchParams.get('body') || '',
            page: searchParams.get('page') || '',
            title: searchParams.get('title') || '',
        }),
        [searchParams],
    );

    // Read scroll target from URL hash (e.g., #123)
    const [scrollToId, setScrollToId] = useState<number | null>(null);

    // Read hash on mount and listen for hashchange events
    useEffect(() => {
        const readHash = () => {
            const hash = window.location.hash.slice(1);
            if (hash) {
                const id = Number.parseInt(hash, 10);
                if (!Number.isNaN(id)) {
                    setScrollToId(id);
                    return;
                }
            }
            setScrollToId(null);
        };

        readHash();
        window.addEventListener('hashchange', readHash);
        return () => window.removeEventListener('hashchange', readHash);
    }, []);

    // Track if filters have been applied for current URL params + data state
    const prevFiltersRef = useRef<string>('');
    const filtersKey = `${activeTab}:${filters.body}:${filters.page}:${filters.title}`;

    // Track data loading state
    const dataLoadedRef = useRef(false);
    const hasData = allPages.length > 0 || allTitles.length > 0;

    // Update URL with new tab
    const setActiveTab = useCallback(
        (tab: FilterScope) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', tab);
            params.delete('body');
            params.delete('page');
            params.delete('title');
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
     */
    const navigateToItem = useCallback(
        (tab: FilterScope, itemId: number) => {
            setScrollToId(itemId);

            const params = new URLSearchParams();
            params.set('tab', tab);

            router.replace(`${pathname}?${params.toString()}`, { scroll: false });

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
     */
    const clearScrollTo = useCallback(() => {
        if (scrollToId) {
            setScrollToId(null);
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
        const hasFilters = filters.body || filters.page || filters.title;
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
