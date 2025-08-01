import memoizeOne from 'memoize-one';

import type { BookStateCore, Page, TableOfContents } from './types';

const getVolumes = memoizeOne((volumeToPages: Record<number, Page[]>) =>
    Object.keys(volumeToPages)
        .map((p) => parseInt(p, 10))
        .sort((a, b) => a - b),
);

const getPages = memoizeOne((pages: Page[] = [], indices: TableOfContents[] = []) => {
    const indexedPages = new Set(indices.map((i) => i.page));
    return pages.map((p) => ({ ...p, ...(indexedPages.has(p.page) && { hasHeader: true }) }));
});

/**
 * Selects all manuscript volume numbers from state, sorted in ascending order.
 * @param state The manuscript state
 * @returns Array of part numbers
 */
export const selectVolumes = (state: BookStateCore): number[] => getVolumes(state.volumeToPages);

/**
 * Selects pages from the currently active manuscript volume.
 * @param state The manuscript state
 * @returns Array of pages or empty array if no volume is selected
 */
export const selectCurrentPages = (state: BookStateCore) =>
    getPages(state.volumeToPages[state.selectedVolume], state.volumeToIndex[state.selectedVolume]);

export const selectTableOfContents = memoizeOne(({ selectedVolume, volumeToIndex }: BookStateCore) => {
    return volumeToIndex[selectedVolume] || [];
});
