import memoizeOne from 'memoize-one';
import type { KetabPage, KetabStateCore, KetabTitle } from './types';

/**
 * Returns all pages, filtered if filter is active
 */
export const selectAllPages = memoizeOne((pages: KetabPage[], filteredPageIds?: number[]): KetabPage[] => {
    if (!filteredPageIds) {
        return pages;
    }
    const idSet = new Set(filteredPageIds);
    return pages.filter((p) => idSet.has(p.id));
});

/**
 * Returns all titles, filtered if filter is active
 */
export const selectAllTitles = memoizeOne((titles: KetabTitle[], filteredTitleIds?: number[]): KetabTitle[] => {
    if (!filteredTitleIds) {
        return titles;
    }
    const idSet = new Set(filteredTitleIds);
    return titles.filter((t) => idSet.has(t.id));
});

/**
 * Returns the count of filtered pages (or all pages if no filter)
 */
export const selectPageCount = (state: KetabStateCore): number => {
    return state.filteredPageIds?.length ?? state.pages.length;
};

/**
 * Returns the count of filtered titles (or all titles if no filter)
 */
export const selectTitleCount = (state: KetabStateCore): number => {
    return state.filteredTitleIds?.length ?? state.titles.length;
};

/**
 * Selector wrapper for use with Zustand
 */
export const createPageSelector = (state: KetabStateCore) => selectAllPages(state.pages, state.filteredPageIds);

/**
 * Selector wrapper for use with Zustand
 */
export const createTitleSelector = (state: KetabStateCore) => selectAllTitles(state.titles, state.filteredTitleIds);
