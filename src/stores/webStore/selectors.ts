import type { Page } from 'flappa-doormal';
import memoizeOne from 'memoize-one';
import { filterByProperty } from '@/lib/common';
import type { WebPage, WebState } from './types';

/**
 * Selects all pages, respecting any active filter
 */
export const selectAllPages = memoizeOne(
    (state: WebState): Array<WebPage & { content: string }> => {
        const ids = new Set(state.filteredPageIds);
        const pages = state.pages.filter(filterByProperty('content'));
        return (ids.size === 0 ? pages : pages.filter((t) => ids.has(t.id))) as any;
    },
    // Custom equality: only recompute if pages array or filter IDs changed
    ([prevState]: WebState[], [nextState]: WebState[]) => {
        return prevState.pages === nextState.pages && prevState.filteredPageIds === nextState.filteredPageIds;
    },
);

/**
 * Selects all titles, respecting any active filter
 */
export const selectAllTitles = memoizeOne(
    (state: WebState): Page[] => {
        const ids = new Set(state.filteredTitleIds);
        const titles = state.pages.filter((p) => p.title).map((p) => ({ content: p.title!, id: p.id }));

        return ids.size === 0 ? titles : titles.filter((t) => ids.has(t.id));
    },
    ([prevState]: WebState[], [nextState]: WebState[]) => {
        return prevState.pages === nextState.pages && prevState.filteredTitleIds === nextState.filteredTitleIds;
    },
);
