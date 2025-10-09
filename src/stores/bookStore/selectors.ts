import memoizeOne from 'memoize-one';
import type { BookStateCore, Page, TableOfContents } from './types';

const EMPTY_STABLE_ARRAY: Page[] = [];

/**
 * Selects all manuscript volume numbers from state, sorted in ascending order.
 * @param state The manuscript state
 * @returns Array of part numbers
 */
export const selectVolumes = memoizeOne((state: BookStateCore): number[] =>
    Object.keys(state.volumeToPages)
        .map((p) => parseInt(p, 10))
        .sort((a, b) => a - b),
);

/**
 * Selects pages from the currently active manuscript volume with header markers.
 * @param state The manuscript state
 * @returns Array of pages with hasHeader flag or empty array if no volume is selected
 */
export const selectCurrentPages = memoizeOne((state: BookStateCore): Page[] => {
    const pages = state.volumeToPages[state.selectedVolume] || EMPTY_STABLE_ARRAY;
    const indices = state.volumeToIndex[state.selectedVolume] || EMPTY_STABLE_ARRAY;

    if (indices.length === 0) {
        return pages;
    }

    const indexedPages = new Set(indices.map((i) => i.page));
    return pages.map((p) => ({ ...p, ...(indexedPages.has(p.page) && { hasHeader: true }) }));
});

/**
 * Selects the table of contents for the currently selected volume.
 * @param state The manuscript state
 * @returns Table of contents array or empty array if none exists
 */
export const selectTableOfContents = (state: BookStateCore): TableOfContents[] => {
    return state.volumeToIndex[state.selectedVolume] || [];
};
