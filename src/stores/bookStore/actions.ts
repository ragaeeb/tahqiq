import { formatTextBlocks, mapTextLinesToParagraphs } from 'kokokor';
import { getNextId } from '@/lib/common';
import { mapManuscriptToJuz } from '@/lib/manuscript';
import { mapTextLineToMarkdown } from '@/lib/markdown';
import { preformatArabicText } from '@/lib/textUtils';
import type { Juz, ManuscriptStateCore } from '@/stores/manuscriptStore/types';
import type { BookStateCore, Kitab, Page, TableOfContents } from './types';

const FOOTNOTE_DIVIDER = '____________';

const extractPagesFromJuz = (file: string, juz: Juz) => {
    const volume = Number(file.split('.')[0]);
    const pages = juz.sheets.map((s) => {
        const textLines = s.observations.map(mapTextLineToMarkdown);
        const paragraphs = mapTextLinesToParagraphs(textLines);
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

    return { index, pages, postProcessingApps: juz.postProcessingApps || [], volume };
};

export const initStore = (fileToJuzOrKitab: Record<string, Juz | Kitab>): Partial<BookStateCore> => {
    const volumeToPages: Record<number, Page[]> = {};
    const volumeToIndex: Record<number, TableOfContents[]> = {};
    const result: Partial<BookStateCore> = { postProcessingApps: [], volumeToIndex, volumeToPages };
    let inputFileName: string | undefined;

    Object.entries(fileToJuzOrKitab).forEach(([file, juzOrKitab]) => {
        if (juzOrKitab.type === 'juz') {
            const { index, pages, postProcessingApps, volume } = extractPagesFromJuz(file, juzOrKitab);
            volumeToIndex[volume] = index;
            volumeToPages[volume] = pages;

            result.postProcessingApps!.push(...postProcessingApps);
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

            result.createdAt = new Date(juzOrKitab.createdAt);
            inputFileName = file;

            result.postProcessingApps!.push(...(juzOrKitab.postProcessingApps || []));
        }
    });

    return {
        ...result,
        selectedVolume: Object.keys(volumeToPages).map(Number).sort()[0],
        ...(inputFileName && { inputFileName }),
    };
};

export const addAjza = (state: BookStateCore, files: Record<string, any>): Partial<BookStateCore> => {
    const newPostProcessingApps = [...state.postProcessingApps];
    const newVolumeToPages = { ...state.volumeToPages };
    const newVolumeToIndex = { ...state.volumeToIndex };

    for (const [file, data] of Object.entries(files)) {
        if (file.endsWith('.json')) {
            const { index, pages, postProcessingApps, volume } = extractPagesFromJuz(file, data as Juz);

            newPostProcessingApps.push(...postProcessingApps);
            newVolumeToPages[volume] = pages;
            newVolumeToIndex[volume] = index;
        }
    }

    return {
        postProcessingApps: newPostProcessingApps,
        volumeToIndex: newVolumeToIndex,
        volumeToPages: newVolumeToPages,
    };
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
): Partial<BookStateCore> => {
    const pages = state.volumeToPages[state.selectedVolume] || [];
    const startingIndex = pages.findIndex((p) => p.id === startingPageId);

    const updatedPages = pages.map((page, index) => {
        if (index >= startingIndex) {
            const offset = index - startingIndex;
            return { ...page, [key]: startingPageValue + offset, lastUpdate: Date.now() };
        }
        return page;
    });

    return { volumeToPages: { ...state.volumeToPages, [state.selectedVolume]: updatedPages } };
};

export const updatePages = (
    state: BookStateCore,
    ids: number[],
    payload: ((p: Page) => Partial<Page>) | Omit<Partial<Page>, 'id' | 'lastUpdate'>,
    updateLastUpdated?: boolean,
): Partial<BookStateCore> => {
    const pages = [...(state.volumeToPages[state.selectedVolume] || [])];
    const idSet = new Set(ids);

    const updatedPages = pages.map((page) => {
        if (!idSet.has(page.id)) {
            return page;
        }

        const updates = typeof payload === 'function' ? payload(page) : payload;

        return { ...page, ...updates, ...(updateLastUpdated && { lastUpdate: Date.now() }) };
    });

    return { volumeToPages: { ...state.volumeToPages, [state.selectedVolume]: updatedPages } };
};

export const reformatPages = (state: BookStateCore, ids: number[]): Partial<BookStateCore> => {
    return updatePages(
        state,
        ids,
        (p) => ({
            text: preformatArabicText(p.text),
            ...(p.footnotes && { footnotes: preformatArabicText(p.footnotes) }),
        }),
        true,
    );
};

export const deletePages = (state: BookStateCore, ids: number[]): Partial<BookStateCore> => {
    const idSet = new Set(ids);
    const filteredPages = (state.volumeToPages[state.selectedVolume] || []).filter((p) => !idSet.has(p.id));

    return { volumeToPages: { ...state.volumeToPages, [state.selectedVolume]: filteredPages } };
};

export const mergeFootnotesWithMatn = (state: BookStateCore, ids: number[]): Partial<BookStateCore> => {
    return updatePages(
        state,
        ids,
        (p) => ({ footnotes: undefined, text: p.footnotes ? `${p.text}\n${p.footnotes}` : p.text }),
        true,
    );
};
