import memoizeOne from 'memoize-one';

import type { ManuscriptStateCore, Page } from './types';

const getVolumes = memoizeOne((volumeToPages: Record<string, any>) =>
    Object.keys(volumeToPages)
        .map((p) => parseInt(p, 10))
        .sort((a, b) => a - b),
);

const getPages = memoizeOne((pages?: Page[]) => pages || []);

/**
 * Selects all transcript part numbers from state, sorted in ascending order.
 * @param state The transcript state
 * @returns Array of part numbers
 */
export const selectVolumes = (state: ManuscriptStateCore): number[] => getVolumes(state.volumeToPages);

/**
 * Selects segments from the currently active transcript.
 * @param state The transcript state
 * @returns Array of segments or empty array if no transcript is selected
 */
export const selectCurrentPages = (state: ManuscriptStateCore) => getPages(state.volumeToPages[state.selectedVolume]);
