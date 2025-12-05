import memoizeOne from 'memoize-one';
import type { ShamelaPage, ShamelaState, ShamelaTitle } from './types';

/**
 * Selects all pages, respecting any active filter
 */
export const selectAllPages = memoizeOne(
    (state: ShamelaState): ShamelaPage[] => {
        if (!state.filteredPageIds) {
            return state.pages;
        }
        const idSet = new Set(state.filteredPageIds);
        return state.pages.filter((p) => idSet.has(p.id));
    },
    // Custom equality: only recompute if pages array or filter IDs changed
    ([prevState], [nextState]) =>
        prevState.pages === nextState.pages && prevState.filteredPageIds === nextState.filteredPageIds,
);

/**
 * Selects all titles, respecting any active filter
 */
export const selectAllTitles = memoizeOne(
    (state: ShamelaState): ShamelaTitle[] => {
        if (!state.filteredTitleIds) {
            return state.titles;
        }
        const idSet = new Set(state.filteredTitleIds);
        return state.titles.filter((t) => idSet.has(t.id));
    },
    // Custom equality: only recompute if titles array or filter IDs changed
    ([prevState], [nextState]) =>
        prevState.titles === nextState.titles && prevState.filteredTitleIds === nextState.filteredTitleIds,
);

/**
 * Selects the total page count (unfiltered)
 */
export const selectPageCount = (state: ShamelaState) => state.pages.length;

/**
 * Selects the total title count (unfiltered)
 */
export const selectTitleCount = (state: ShamelaState) => state.titles.length;
