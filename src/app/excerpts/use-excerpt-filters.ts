'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createMatcher } from '@/lib/search';
import type { Excerpt, Heading } from '@/stores/excerptsStore/types';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';

export type FilterField = 'nass' | 'text' | 'page' | 'ids';
export type FilterScope = 'excerpts' | 'headings' | 'footnotes';
export type SortMode = 'default' | 'length';

type Filters = { ids?: string[]; nass: string; page: string; text: string };

/**
 * Filters items based on page, nass, and text criteria
 */
function filterItems<
    T extends Pick<Excerpt, 'id' | 'from' | 'nass' | 'text'> | Pick<Heading, 'id' | 'from' | 'nass' | 'text'>,
>(items: T[], filters: Filters): T[] {
    return items.filter((item) => {
        if (filters.page) {
            const pageNum = Number.parseInt(filters.page, 10);
            if (!Number.isNaN(pageNum) && item.from !== pageNum) {
                return false;
            }
        }
        if (filters.ids && filters.ids.length > 0 && !filters.ids.includes(item.id)) {
            return false;
        }
        if (filters.nass && !createMatcher(filters.nass)(item.nass)) {
            return false;
        }
        if (filters.text && !createMatcher(filters.text)(item.text)) {
            return false;
        }
        return true;
    });
}

/**
 * Hook to manage URL-based filtering for excerpts, headings, and footnotes.
 * Persists filter queries in URL search params for refresh-persistence and shareability.
 *
 * URL format: ?tab=excerpts&nass=pattern&text=hello&page=50#2333
 * The hash (#2333) can be used to scroll to a row with that `from` value.
 */
export function useExcerptFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Get store data and filter actions
    const allExcerpts = useExcerptsStore((state) => state.excerpts);
    const allHeadings = useExcerptsStore((state) => state.headings);
    const allFootnotes = useExcerptsStore((state) => state.footnotes);
    const filterExcerptsByIds = useExcerptsStore((state) => state.filterExcerptsByIds);
    const filterHeadingsByIds = useExcerptsStore((state) => state.filterHeadingsByIds);
    const filterFootnotesByIds = useExcerptsStore((state) => state.filterFootnotesByIds);

    // Read current tab and filter values from URL
    const activeTab = (searchParams.get('tab') as FilterScope) || 'excerpts';
    const sortMode = (searchParams.get('sort') as SortMode) || 'default';
    const filters = useMemo(() => {
        const idsParam = searchParams.get('ids');
        return {
            ids: idsParam
                ? idsParam
                      .split(',')
                      .filter(Boolean)
                      .map((id) => id.trim())
                : undefined,
            nass: searchParams.get('nass') || '',
            page: searchParams.get('page') || '',
            text: searchParams.get('text') || '',
        };
    }, [searchParams]);

    // Read scroll target from URL hash
    // For excerpts: #2333 scrolls to row with `from` matching 2333
    // For headings: #C123 scrolls to row with `id` matching C123
    const [scrollToFrom, setScrollToFrom] = useState<number | null>(null);
    const [scrollToId, setScrollToId] = useState<string | null>(null);

    // Read hash on mount and listen for hashchange events
    useEffect(() => {
        const readHash = () => {
            const hash = window.location.hash.slice(1); // Remove the # prefix
            if (hash) {
                // If hash is purely numeric, treat as `from` value (for excerpts)
                const fromValue = Number.parseInt(hash, 10);
                if (!Number.isNaN(fromValue) && hash === fromValue.toString()) {
                    setScrollToFrom(fromValue);
                    setScrollToId(null);
                    return;
                }
                // Otherwise treat as ID (for headings)
                setScrollToId(hash);
                setScrollToFrom(null);
                return;
            }
            setScrollToFrom(null);
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
    const filtersKey = `${activeTab}:${filters.nass}:${filters.text}:${filters.page}:${filters.ids?.join(',') || ''}`;

    // Track data loading state - we need to reapply filters when data first loads
    const dataLoadedRef = useRef(false);
    const hasData = allExcerpts.length > 0 || allHeadings.length > 0 || allFootnotes.length > 0;

    // Update URL with new tab
    const setActiveTab = useCallback(
        (tab: FilterScope) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', tab);
            // Clear filters when switching tabs
            params.delete('nass');
            params.delete('text');
            params.delete('page');
            params.delete('ids');
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

    // Update URL with sort mode
    const setSort = useCallback(
        (mode: SortMode) => {
            const params = new URLSearchParams(searchParams.toString());

            if (mode === 'default') {
                params.delete('sort');
            } else {
                params.set('sort', mode);
            }

            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [searchParams, router, pathname],
    );

    // Clear the scroll state
    const clearScrollTo = useCallback(() => {
        setScrollToFrom(null);
        setScrollToId(null);
    }, []);

    // Add specific IDs to the current filter
    const addIdsToFilter = useCallback(
        (newIds: string[]) => {
            const params = new URLSearchParams(searchParams.toString());
            const currentIds = params.get('ids')?.split(',').filter(Boolean) || [];
            const updatedIds = Array.from(new Set([...currentIds, ...newIds]));
            params.set('ids', updatedIds.join(','));
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [searchParams, router, pathname],
    );

    // Compute filtered IDs for each tab based on active tab and filters
    const filteredResults = useMemo(() => {
        if (!hasData) {
            return { eIds: undefined, fIds: undefined, hIds: undefined };
        }
        const hasFilters = !!(filters.nass || filters.text || filters.page || filters.ids?.length);
        if (!hasFilters) {
            return { eIds: undefined, fIds: undefined, hIds: undefined };
        }

        return {
            eIds: activeTab === 'excerpts' ? filterItems(allExcerpts, filters).map((e) => e.id) : undefined,
            fIds: activeTab === 'footnotes' ? filterItems(allFootnotes, filters).map((f) => f.id) : undefined,
            hIds: activeTab === 'headings' ? filterItems(allHeadings, filters).map((h) => h.id) : undefined,
        };
    }, [hasData, filters, activeTab, allExcerpts, allFootnotes, allHeadings]);

    // Sync filtered IDs to store when filters change or data is loaded
    useEffect(() => {
        const isInitialDataLoad = !dataLoadedRef.current && hasData;
        if (isInitialDataLoad) {
            dataLoadedRef.current = true;
        }

        if (prevFiltersRef.current === filtersKey && !isInitialDataLoad) {
            return;
        }

        prevFiltersRef.current = filtersKey;

        // Apply to store
        filterExcerptsByIds(filteredResults.eIds);
        filterHeadingsByIds(filteredResults.hIds);
        filterFootnotesByIds(filteredResults.fIds);
    }, [filtersKey, hasData, filteredResults, filterExcerptsByIds, filterHeadingsByIds, filterFootnotesByIds]);

    return {
        activeTab,
        addIdsToFilter,
        clearScrollTo,
        filters,
        scrollToFrom,
        scrollToId,
        setActiveTab,
        setFilter,
        setSort,
        sortMode,
    };
}
