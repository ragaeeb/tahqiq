'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createMatcher } from '@/lib/search';
import type { Excerpt, Heading } from '@/stores/excerptsStore/types';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';

export type FilterField = 'nass' | 'text' | 'page';
export type FilterScope = 'excerpts' | 'headings' | 'footnotes';

type Filters = { nass: string; page: string; text: string };

/**
 * Filters items based on page, nass, and text criteria
 */
function filterItems<T extends Pick<Excerpt, 'from' | 'nass' | 'text'> | Pick<Heading, 'from' | 'nass' | 'text'>>(
    items: T[],
    filters: Filters,
): T[] {
    return items.filter((item) => {
        if (filters.page) {
            const pageNum = Number.parseInt(filters.page, 10);
            if (!Number.isNaN(pageNum) && item.from !== pageNum) {
                return false;
            }
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
    const filters = useMemo(
        () => ({
            nass: searchParams.get('nass') || '',
            page: searchParams.get('page') || '',
            text: searchParams.get('text') || '',
        }),
        [searchParams],
    );

    // Read scroll target from URL hash (e.g., #2333)
    // This scrolls to the row with `from` matching this value
    const [scrollToFrom, setScrollToFrom] = useState<number | null>(null);

    // Read hash on mount and listen for hashchange events
    useEffect(() => {
        const readHash = () => {
            const hash = window.location.hash.slice(1); // Remove the # prefix
            if (hash) {
                const fromValue = Number.parseInt(hash, 10);
                if (!Number.isNaN(fromValue)) {
                    setScrollToFrom(fromValue);
                    return;
                }
            }
            setScrollToFrom(null);
        };

        // Read initial hash on mount
        readHash();

        // Listen for hash changes (e.g., browser back/forward)
        window.addEventListener('hashchange', readHash);
        return () => window.removeEventListener('hashchange', readHash);
    }, []);

    // Track if filters have been applied for current URL params + data state
    const prevFiltersRef = useRef<string>('');
    const filtersKey = `${activeTab}:${filters.nass}:${filters.text}:${filters.page}`;

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
     * Clear the scrollToFrom state after scrolling is complete.
     * The hash remains in the URL for shareability.
     */
    const clearScrollTo = useCallback(() => {
        setScrollToFrom(null);
    }, []);

    // Apply filters when URL params change OR when data is first loaded
    useEffect(() => {
        const hasFilters = filters.nass || filters.text || filters.page;

        // Check if this is a data load event (went from no data to having data)
        const isDataLoadEvent = !dataLoadedRef.current && hasData;
        if (isDataLoadEvent) {
            dataLoadedRef.current = true;
        }

        // Skip if:
        // 1. Filters haven't changed AND this isn't a data load event
        // 2. There are no filters to apply
        const filtersChanged = prevFiltersRef.current !== filtersKey;

        if (!filtersChanged && !isDataLoadEvent) {
            return;
        }

        if (!hasFilters) {
            prevFiltersRef.current = filtersKey;
            filterExcerptsByIds(undefined);
            filterHeadingsByIds(undefined);
            filterFootnotesByIds(undefined);
            return;
        }

        if (!hasData) {
            return;
        }

        prevFiltersRef.current = filtersKey;

        // Clear other tab filters
        if (activeTab !== 'excerpts') {
            filterExcerptsByIds(undefined);
        }
        if (activeTab !== 'headings') {
            filterHeadingsByIds(undefined);
        }
        if (activeTab !== 'footnotes') {
            filterFootnotesByIds(undefined);
        }

        // Apply filter only to active tab
        if (activeTab === 'excerpts') {
            const filtered = filterItems(allExcerpts, filters);
            filterExcerptsByIds(filtered.map((e) => e.id));
        } else if (activeTab === 'headings') {
            const filtered = filterItems(allHeadings, filters);
            filterHeadingsByIds(filtered.map((h) => h.id));
        } else if (activeTab === 'footnotes') {
            const filtered = filterItems(allFootnotes, filters);
            filterFootnotesByIds(filtered.map((f) => f.id));
        }
    }, [
        filtersKey,
        hasData,
        activeTab,
        filters,
        allExcerpts,
        allHeadings,
        allFootnotes,
        filterExcerptsByIds,
        filterHeadingsByIds,
        filterFootnotesByIds,
    ]);

    return { activeTab, clearScrollTo, filters, scrollToFrom, setActiveTab, setFilter };
}
