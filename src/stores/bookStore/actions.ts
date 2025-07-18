import { formatTextBlocks, mapTextLinesToParagraphs } from 'kokokor';
import { rawReturn } from 'mutative';

import type { Juz, ManuscriptStateCore } from '@/stores/manuscriptStore/types';

import { getNextId } from '@/lib/common';
import { FOOTNOTES_DELIMITER } from '@/lib/constants';
import { mapManuscriptToJuz } from '@/lib/manuscript';
import { preformatArabicText } from '@/lib/textUtils';

import type { BookStateCore, Kitab, Page, TableOfContents } from './types';

import { selectCurrentPages } from './selectors';

const FOOTNOTE_DIVIDER = '____________';

const extractPagesFromJuz = (file: string, juz: Juz) => {
    const volume = Number(file.split('.')[0]);
    const pages = juz.sheets.map((s) => {
        const paragraphs = mapTextLinesToParagraphs(s.observations);
        const text = formatTextBlocks(paragraphs, FOOTNOTE_DIVIDER);
        const [body, footnotes] = text.split(FOOTNOTE_DIVIDER);

        return {
            page: s.page,
            text: preformatArabicText(body, true),
            ...(footnotes && { footnotes: preformatArabicText(footnotes, true) }),
            id: getNextId(),
            lastUpdate: Date.now(),
            volume,
            volumePage: s.page,
        };
    });

    const index = juz.sheets.flatMap((s) => {
        return s.observations.filter((o) => o.isHeading).map((o) => ({ id: getNextId(), page: s.page, title: o.text }));
    });

    return { index, pages, volume };
};

export const initStore = (fileToJuzOrKitab: Record<string, Juz | Kitab>) => {
    const volumeToPages: Record<number, Page[]> = {};
    const volumeToIndex: Record<number, TableOfContents[]> = {};
    const result: Partial<BookStateCore> = { volumeToIndex, volumeToPages };
    let inputFileName: string | undefined;

    Object.entries(fileToJuzOrKitab).forEach(([file, juzOrKitab]) => {
        if (juzOrKitab.type === 'juz') {
            const { index, pages, volume } = extractPagesFromJuz(file, juzOrKitab);
            volumeToIndex[volume] = index;
            volumeToPages[volume] = pages;
        } else if (juzOrKitab.type === 'book') {
            juzOrKitab.pages.forEach((p) => {
                const volume = p.volume || 1;

                if (!volumeToPages[volume]) {
                    volumeToPages[volume] = [];
                }

                volumeToPages[p.volume || 1].push({ ...p, id: getNextId(), lastUpdate: Date.now() });
            });

            juzOrKitab.index.forEach((p) => {
                const volume = p.volume || 1;

                if (!volumeToIndex[volume]) {
                    volumeToIndex[volume] = [];
                }

                volumeToIndex[volume].push({ ...p, id: getNextId() });
            });

            result.createdAt = juzOrKitab.createdAt;
            inputFileName = file;

            if (juzOrKitab.postProcessingApps) {
                result.postProcessingApps = [...juzOrKitab.postProcessingApps];
            }
        }
    });

    const indexKeys = new Set(
        Object.entries(volumeToIndex).flatMap(([volume, indices]) => indices.map((i) => `${volume}/${i.page}`)),
    );

    Object.values(volumeToPages)
        .flat()
        .forEach((p) => {
            if (indexKeys.has(`${p.volume}/${p.page}`)) {
                p.hasHeader = true;
            }
        });

    return rawReturn({
        ...result,
        selectedVolume: Object.keys(volumeToPages).map(Number).sort()[0],
        ...(inputFileName && { inputFileName }),
    });
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

export const reformatPages = (state: BookStateCore, ids: number[]) => {
    updatePages(
        state,
        ids,
        (p) => {
            p.text = preformatArabicText(p.text);

            if (p.footnotes) {
                p.footnotes = preformatArabicText(p.footnotes);
            }
        },
        true,
    );
};

export const deletePages = (state: BookStateCore, ids: number[]) => {
    state.volumeToPages[state.selectedVolume] = state.volumeToPages[state.selectedVolume].filter(
        (p) => !ids.includes(p.id),
    );
};

export const mergeFootnotesWithMatn = (state: BookStateCore, ids: number[]) => {
    updatePages(
        state,
        ids,
        (p) => {
            if (p.footnotes) {
                p.text = p.text + FOOTNOTES_DELIMITER + p.footnotes;
                p.footnotes = undefined;
            }
        },
        true,
    );
};
