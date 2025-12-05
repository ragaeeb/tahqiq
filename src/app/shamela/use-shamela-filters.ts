'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { ShamelaPage, ShamelaTitle } from '@/stores/shamelaStore/types';
import { useShamelaStore } from '@/stores/shamelaStore/useShamelaStore';

export type FilterField = 'content' | 'id';
export type FilterScope = 'pages' | 'titles';

type Filters = { content: string; id: string };

/**
 * Filters pages based on id and content criteria
 */
function filterPages(items: ShamelaPage[], filters: Filters): ShamelaPage[] {
    return items.filter((item) => {
        if (filters.id) {
            const idNum = Number.parseInt(filters.id, 10);
            if (!Number.isNaN(idNum) && item.id !== idNum) {
                return false;
            }
        }
        if (filters.content && !item.body.includes(filters.content)) {
            return false;
        }
        return true;
    });
}

/**
 * Filters titles based on id and content criteria
 */
function filterTitles(items: ShamelaTitle[], filters: Filters): ShamelaTitle[] {
    return items.filter((item) => {
        if (filters.id) {
            const idNum = Number.parseInt(filters.id, 10);
            if (!Number.isNaN(idNum) && item.id !== idNum) {
                return false;
            }
        }
        if (filters.content && !item.content.includes(filters.content)) {
            return false;
        }
        return true;
    });
}

/**
 * Hook to manage URL-based filtering for shamela pages and titles.
 * Persists filter queries in URL search params for refresh-persistence and shareability.
 *
 * URL format: ?tab=pages&content=pattern&id=50
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

    return { activeTab, filters, setActiveTab, setFilter };
}
