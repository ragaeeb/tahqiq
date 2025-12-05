'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { createMatcher } from '@/lib/search';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';

export type FilterField = 'nass' | 'text' | 'page';
export type FilterScope = 'excerpts' | 'headings' | 'footnotes';

/**
 * Hook to manage URL-based filtering for excerpts, headings, and footnotes.
 * Persists filter queries in URL search params for refresh-persistence and shareability.
 *
 * URL format: ?tab=excerpts&nass=pattern&text=hello&page=50
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
            const filtered = allExcerpts.filter((e) => {
                if (filters.page) {
                    const pageNum = Number.parseInt(filters.page);
                    if (!Number.isNaN(pageNum) && e.from !== pageNum) {
                        return false;
                    }
                }
                if (filters.nass && !createMatcher(filters.nass)(e.nass)) {
                    return false;
                }
                if (filters.text && !createMatcher(filters.text)(e.text)) {
                    return false;
                }
                return true;
            });
            filterExcerptsByIds(filtered.map((e) => e.id));
        } else if (activeTab === 'headings') {
            const filtered = allHeadings.filter((h) => {
                if (filters.page) {
                    const pageNum = Number.parseInt(filters.page);
                    if (!Number.isNaN(pageNum) && h.from !== pageNum) {
                        return false;
                    }
                }
                if (filters.nass && !createMatcher(filters.nass)(h.nass)) {
                    return false;
                }
                if (filters.text && !createMatcher(filters.text)(h.text)) {
                    return false;
                }
                return true;
            });
            filterHeadingsByIds(filtered.map((h) => h.id));
        } else if (activeTab === 'footnotes') {
            const filtered = allFootnotes.filter((f) => {
                if (filters.page) {
                    const pageNum = Number.parseInt(filters.page, 10);
                    if (!Number.isNaN(pageNum) && f.from !== pageNum) {
                        return false;
                    }
                }
                if (filters.nass && !createMatcher(filters.nass)(f.nass)) {
                    return false;
                }
                if (filters.text && !createMatcher(filters.text)(f.text)) {
                    return false;
                }
                return true;
            });
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

    return { activeTab, filters, setActiveTab, setFilter };
}
