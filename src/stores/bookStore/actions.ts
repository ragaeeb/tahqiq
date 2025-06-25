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

export const shiftValues = (
    state: BookStateCore,
    startingPageId: number,
    startingPageValue: number,
    key: keyof Pick<Page, 'page' | 'volumePage'>,
) => {
    const pages = selectCurrentPages(state);
    const startingIndex = pages.findIndex((p) => p.id === startingPageId);

    const startingPage = pages[startingIndex];
    startingPage[key] = startingPageValue;
    startingPage.lastUpdate = Date.now();

    let counter = startingPageValue + 1;

    for (let i = startingIndex + 1; i < pages.length; i++) {
        const page = pages[i];
        page[key] = counter;
        page.lastUpdate = Date.now();

        counter++;
    }
};

const getPagesById = (state: BookStateCore, pageIds: number[]) => {
    const result: Page[] = [];
    const pages = selectCurrentPages(state);
    const ids = new Set(pageIds);

    for (const page of pages) {
        if (ids.has(page.id)) {
            result.push(page);
        }
    }

    return result;
};

export const updatePages = (
    state: BookStateCore,
    ids: number[],
    payload: ((p: Page) => void) | Omit<Partial<Page>, 'id' | 'lastUpdate'>,
    updateLastUpdated?: boolean,
) => {
    const pages = getPagesById(state, ids);

    for (const page of pages) {
        if (typeof payload === 'function') {
            payload(page);
        } else {
            Object.assign(page, payload);
        }

        if (updateLastUpdated) {
            page.lastUpdate = Date.now();
        }
    }
};
