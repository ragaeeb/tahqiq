import memoizeOne from 'memoize-one';

import type { ManuscriptStateCore, Page } from './types';

const getVolumes = memoizeOne((volumeToPages: Record<string, Page[]>) =>
    Object.keys(volumeToPages)
        .map((p) => parseInt(p, 10))
        .sort((a, b) => a - b),
);

const getPages = memoizeOne((pages?: Page[]) => pages || []);

/**
 * Selects all manuscript volume numbers from state, sorted in ascending order.
 * @param state The manuscript state
 * @returns Array of part numbers
 */
export const selectVolumes = (state: ManuscriptStateCore): number[] => getVolumes(state.volumeToPages);

/**
 * Selects pages from the currently active manuscript volume.
 * @param state The manuscript state
 * @returns Array of pages or empty array if no volume is selected
 */
export const selectCurrentPages = (state: ManuscriptStateCore) => getPages(state.volumeToPages[state.selectedVolume]);
