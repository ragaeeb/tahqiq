import { getNextId } from '@/lib/common';
import { mapManuscriptToJuz } from '@/lib/manuscript';

import type { ManuscriptStateCore } from '../manuscriptStore/types';
import type { BookStateCore, Juz, Page, TableOfContents } from './types';

import { selectCurrentPages } from './selectors';

/**
 * Selects all pages in the current manuscript or clears selection
 *
 * @param state - Current manuscript state
 * @param isSelected - Boolean indicating whether to select all or clear selection
 * @returns Object with updated selection state
 */
export const selectAllPages = (state: BookStateCore, isSelected: boolean) => {
    return { selectedPages: isSelected ? selectCurrentPages(state) : [] };
};

export const initStore = (fileToJuz: Record<string, Juz>) => {
    const volumeToPages: Record<number, Page[]> = {};
    const volumeToIndex: Record<number, TableOfContents[]> = {};

    Object.entries(fileToJuz).forEach(([file, juz]) => {
        const volume = Number(file.split('.')[0]);
        volumeToPages[volume] = juz.sheets.map((s) => ({
            ...s,
            id: getNextId(),
            lastUpdate: Date.now(),
            volume,
            volumePage: s.page,
        }));

        volumeToIndex[volume] = (juz.index || []).map((bookmark) => ({ ...bookmark, id: getNextId() }));
    });

    return { selectedVolume: 1, volumeToIndex, volumeToPages };
};

export const initFromManuscript = (manuscript: ManuscriptStateCore) => {
    const juz = mapManuscriptToJuz(manuscript);
    return initStore({ '1.json': juz });
};
