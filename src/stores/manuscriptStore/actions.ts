import {
    alignTextSegments,
    areSimilarAfterNormalization,
    correctReferences,
    fixTypo,
    isArabicTextNoise,
} from 'baburchi';
import {
    calculateDPI,
    flipAndAlignObservations,
    mapMatrixToBoundingBox,
    mapObservationsToTextLines,
    mergeObservations,
    type Observation,
} from 'kokokor';
import { rawReturn } from 'mutative';

import { getNextId } from '@/lib/common';
import { SWS_SYMBOL } from '@/lib/constants';

import type {
    Juz,
    ManuscriptStateCore,
    RawInputFiles,
    Sheet,
    StructureMetadata,
    SuryaPageOcrResult,
    TextLine,
    TextLinePatch,
} from './types';

import { assertHasRequiredFiles } from './guards';

/**
 * Converts Surya OCR page results to standardized Observation format.
 * Maps each text line from Surya format to the common Observation structure
 * used throughout the application.
 *
 * @param surya - Surya OCR page result containing text lines with bounding boxes
 * @returns Array of observations in standardized format
 */
const mapSuryaPageResultToObservations = (surya: SuryaPageOcrResult): Observation[] => {
    return surya.text_lines.map((line) => ({
        bbox: mapMatrixToBoundingBox(line.bbox),
        text: line.text.replace(/<\/?[a-z][^>]*?>/gi, ' '),
    }));
};

const PAGES_TO_LOG: number[] = [] as const;

const createSheet = (
    page: number,
    macObservations: Observation[],
    alternateObservations: Observation[],
    struct: StructureMetadata,
): Sheet => {
    const shouldLog = PAGES_TO_LOG.includes(page);

    if (shouldLog) {
        console.log('page', page, struct);
    }

    const textLines = mapObservationsToTextLines(macObservations, struct.dpi, {
        horizontalLines: struct.horizontal_lines,
        rectangles: struct.rectangles,
        ...(shouldLog && { log: console.log }),
        poetryDetectionOptions: {
            minWidthRatioForMerged: null,
        },
    });

    const altObservations = alternateObservations
        .filter((o) => !isArabicTextNoise(o.text))
        .map((o) => ({ id: getNextId(), text: o.text }));

    return {
        alt: altObservations,
        observations: textLines
            .filter((o) => !isArabicTextNoise(o.text))
            .map((o) => {
                return {
                    ...o,
                    id: getNextId(),
                    lastUpdate: Date.now(),
                };
            }),
        page,
    };
};

const getSuryaObservations = (suryaPage: SuryaPageOcrResult, pdfWidth: number, pdfHeight: number) => {
    const { height: imageHeight, width: imageWidth } = mapMatrixToBoundingBox(suryaPage.image_bbox);
    const { x: dpiX } = calculateDPI(
        { height: imageHeight, width: imageWidth },
        { height: pdfHeight, width: pdfWidth },
    );

    return flipAndAlignObservations(mapSuryaPageResultToObservations(suryaPage), imageWidth, dpiX);
};

export const initStoreFromJuz = (juz: Juz): Partial<ManuscriptStateCore> => {
    return rawReturn({
        createdAt: new Date(juz.timestamp),
        isInitialized: true,
        ...(juz.postProcessingApps && { postProcessingApps: juz.postProcessingApps }),
        sheets: juz.sheets,
        url: juz.url,
    });
};

export const initStore = (fileNameToData: RawInputFiles) => {
    assertHasRequiredFiles(fileNameToData);

    const {
        ['batch_output.json']: fileToObservations,
        ['page_size.txt']: pageSizeTxt,
        ['structures.json']: { result: structures },
        ['surya.json']: suryaJson,
    } = fileNameToData;

    const [surya] = Object.values(suryaJson);
    const [pdfWidth, pdfHeight] = pageSizeTxt.trim().split(' ').map(Number);

    const sheets = Object.entries(fileToObservations)
        .map(([imageFile, macOCRData]) => {
            const pageNumber = parseInt(imageFile.split('.')[0]!);

            if (!macOCRData.observations.length) {
                return {
                    alt: [],
                    observations: [],
                    page: pageNumber,
                };
            }

            const suryaPage = surya.find((s) => s.page === pageNumber);

            if (!suryaPage) {
                throw new Error(`No Surya page data found for page ${pageNumber} (file: ${imageFile})`);
            }

            const alternateObservations = getSuryaObservations(suryaPage, pdfWidth, pdfHeight);

            const sheet = createSheet(
                pageNumber,
                macOCRData.observations,
                alternateObservations,
                structures[imageFile],
            );

            return sheet;
        })
        .toSorted((a, b) => a.page - b.page);

    return rawReturn({
        isInitialized: true,
        sheets,
    });
};

export const splitAltAtLineBreak = (state: ManuscriptStateCore, page: number, id: number, alt: string) => {
    const sheet = state.sheets.find((s) => s.page === page)!;
    const index = sheet.observations.findIndex((o) => o.id === id);

    const [firstLine, secondLine] = alt.split('\n');

    if (secondLine) {
        const altObservation = {
            ...sheet.alt[index],
            lastUpdate: Date.now(),
            text: firstLine,
        };

        const nextObservation = {
            ...sheet.alt[index],
            id: getNextId(),
            lastUpdate: Date.now(),
            text: secondLine,
        };

        sheet.alt.splice(index, 1, altObservation, nextObservation);
    } else {
        sheet.alt[index].text = alt;
    }
};

export const mergeWithAbove = (state: ManuscriptStateCore, page: number, id: number, mergeAsl = false) => {
    const sheet = state.sheets.find((s) => s.page === page)!;
    const index = sheet.observations.findIndex((o) => o.id === id);

    if (mergeAsl) {
        const aboveObservation = sheet.observations[index - 1];
        const currentObservation = sheet.observations[index];

        const mergedObservation = {
            ...aboveObservation,
            lastUpdate: Date.now(),
            text: `${aboveObservation.text} ${currentObservation.text}`.trim(),
        };

        sheet.observations.splice(index - 1, 2, mergedObservation);
    } else {
        const above = sheet.alt[index - 1];
        const current = sheet.alt[index];

        const mergedAlt = {
            ...above,
            lastUpdate: Date.now(),
            text: `${above.text} ${current.text}`.trim(),
        };

        sheet.alt.splice(index - 1, 2, mergedAlt);
    }
};

export const merge = (state: ManuscriptStateCore, page: number, ids: number[]) => {
    const sheet = state.sheets.find((s) => s.page === page)!;

    // Get the indices of observations to merge
    const indices = ids
        .map((id) => sheet.observations.findIndex((o) => o.id === id))
        .filter((index) => index !== -1)
        .sort((a, b) => a - b);

    // Ensure indices are adjacent
    for (let i = 1; i < indices.length; i++) {
        if (indices[i] !== indices[i - 1] + 1) {
            throw new Error('Observations to merge must be adjacent');
        }
    }

    if (indices.length <= 1) {
        return; // Nothing to merge
    }

    // Get observations to merge
    const observationsToMerge = indices.map((index) => sheet.observations[index]);
    const altToMerge = indices.map((index) => sheet.alt[index]);

    // Merge observations
    const mergedObservation = {
        ...mergeObservations(observationsToMerge),
        id: observationsToMerge[0].id,
        isCentered: observationsToMerge.some((o) => o.isCentered),
        isHeading: observationsToMerge.some((o) => o.isHeading),
        isPoetic: observationsToMerge.some((o) => o.isPoetic),
        lastUpdate: Date.now(),
    };

    // Merge alt elements
    const mergedAlt = {
        ...altToMerge[0],
        lastUpdate: Date.now(),
        text: altToMerge
            .map((alt) => alt.text)
            .join(' ')
            .trim(),
    };

    sheet.observations.splice(indices[0], indices.length, mergedObservation);
    sheet.alt.splice(indices[0], indices.length, mergedAlt);
};

export const mergeWithBelow = (state: ManuscriptStateCore, page: number, id: number, mergeAsl = false) => {
    const sheet = state.sheets.find((s) => s.page === page)!;
    const index = sheet.observations.findIndex((o) => o.id === id);

    if (mergeAsl) {
        const currentObservation = sheet.observations[index];
        const belowObservation = sheet.observations[index + 1];

        const mergedObservation = {
            ...currentObservation,
            lastUpdate: Date.now(),
            text: `${belowObservation.text} ${currentObservation.text}`.trim(),
        };

        sheet.observations.splice(index, 2, mergedObservation);
    } else {
        // Check if there's a row below to merge with
        if (index + 1 >= sheet.alt.length) {
            return; // No row below to merge with
        }

        const current = sheet.alt[index];
        const below = sheet.alt[index + 1];

        const mergedAlt = {
            ...current,
            lastUpdate: Date.now(),
            text: `${below.text} ${current.text}`.trim(),
        };

        sheet.alt.splice(index, 2, mergedAlt);
    }
};

export const deleteSupport = (state: ManuscriptStateCore, page: number, id: number) => {
    const sheet = state.sheets.find((s) => s.page === page)!;
    const index = sheet.observations.findIndex((o) => o.id === id);

    sheet.alt.splice(index, 1);
};

export const fixTypos = (state: ManuscriptStateCore, ids: number[]) => {
    const idsSet = new Set(ids);
    const options = { typoSymbols: [SWS_SYMBOL, '»', '«'] };

    state.sheets.forEach((sheet) => {
        sheet.observations.forEach((observation, index) => {
            if (idsSet.has(observation.id)) {
                observation.lastUpdate = Date.now();
                observation.text = fixTypo(observation.text, sheet.alt[index].text, options);
            }
        });
    });
};

export const autoCorrectFootnotes = (state: ManuscriptStateCore, pages: number[]) => {
    const sheets = getSheets(state, pages);

    for (const sheet of sheets) {
        const corrected = correctReferences(sheet.observations);

        if (corrected !== sheet.observations) {
            sheet.observations = corrected.map((o) => ({ ...o, lastUpdate: Date.now() }));
        }
    }
};

export const clearOutPages = (state: ManuscriptStateCore, pages: number[]) => {
    const sheets = getSheets(state, pages);

    for (const sheet of sheets) {
        sheet.observations = [];
    }
};

const getTextLines = (state: ManuscriptStateCore, observationIds: number[]) => {
    const result: TextLine[] = [];
    const ids = new Set(observationIds);

    for (const sheet of state.sheets) {
        for (const o of sheet.observations) {
            if (ids.has(o.id)) {
                result.push(o);
            }
        }
    }

    return result;
};

const getSheets = (state: ManuscriptStateCore, pages: number[]) => {
    const result: Sheet[] = [];
    const ids = new Set(pages);

    for (const sheet of state.sheets) {
        if (ids.has(sheet.page)) {
            result.push(sheet);
        }
    }

    return result;
};

export const updateTextLines = (
    state: ManuscriptStateCore,
    ids: number[],
    payload: TextLinePatch,
    updateLastUpdated = true,
) => {
    const observations = getTextLines(state, ids);

    for (const o of observations) {
        if (typeof payload === 'function') {
            payload(o);
        } else {
            Object.assign(o, payload);
        }

        if (updateLastUpdated) {
            o.lastUpdate = Date.now();
        }
    }
};

export const updatePages = (
    state: ManuscriptStateCore,
    pages: number[],
    payload: TextLinePatch,
    updateLastUpdated = true,
) => {
    const sheets = getSheets(state, pages);
    const ids = sheets.flatMap((s) => s.observations.map((o) => o.id));

    updateTextLines(state, ids, payload, updateLastUpdated);
};

export const deleteLines = (state: ManuscriptStateCore, ids: number[]) => {
    const idsSet = new Set(ids);

    state.sheets.forEach((sheet) => {
        const filtered = sheet.observations.filter((observation) => !idsSet.has(observation.id));

        if (filtered.length !== sheet.observations.length) {
            sheet.observations = filtered;
        }
    });
};

export const deleteSupports = (state: ManuscriptStateCore, ids: number[]) => {
    const idsSet = new Set(ids);

    state.sheets.forEach((sheet) => {
        const supportIds = sheet.observations
            .map((observation, i) => idsSet.has(observation.id) && sheet.alt[i].id)
            .filter(Boolean);

        if (supportIds.length) {
            sheet.alt = sheet.alt.filter((alt) => !supportIds.includes(alt.id));
        }
    });
};

export const expandFilteredRow = (state: ManuscriptStateCore, id: number) => {
    for (const sheet of state.sheets) {
        const index = sheet.observations.findIndex((o) => o.id === id);

        if (index !== -1) {
            const prev = sheet.observations[index - 1];
            const next = sheet.observations[index + 1];

            if (prev) {
                state.idsFilter.add(prev.id);
            }

            if (next) {
                state.idsFilter.add(next.id);
            }
        }
    }
};

export const filterByPages = (state: ManuscriptStateCore, pagesToFilterBy: number[]) => {
    const idsFilter = new Set<number>();
    const sheets = getSheets(state, pagesToFilterBy);

    for (const sheet of sheets) {
        for (const o of sheet.observations) {
            idsFilter.add(o.id);
        }
    }

    return rawReturn({ idsFilter });
};

export const filterBySimilar = (state: ManuscriptStateCore, ids: number[], threshold: number) => {
    const idsFilter = new Set<number>();
    const texts = getTextLines(state, ids).map((l) => l.text);

    for (const sheet of state.sheets) {
        for (const o of sheet.observations) {
            if (texts.some((text) => areSimilarAfterNormalization(o.text, text, threshold))) {
                idsFilter.add(o.id);
            }
        }
    }

    return rawReturn({ idsFilter });
};

export const searchAndReplace = (state: ManuscriptStateCore, pattern: RegExp | string, replacement: string) => {
    for (const sheet of state.sheets) {
        for (const observation of sheet.observations) {
            const newValue = observation.text.replace(pattern, replacement);

            if (observation.text !== newValue) {
                observation.text = newValue;
                observation.lastUpdate = Date.now();
            }
        }
    }
};

export const alignPoetry = (state: ManuscriptStateCore, pages: number[]) => {
    const sheets = getSheets(state, pages);

    for (const sheet of sheets) {
        const mergedAlt = alignAndMergeAltPoetry(sheet);
        sheet.alt = mergedAlt;
    }
};

/**
 * Aligns and merges poetic lines from an alternative OCR source ('alt') to match
 * the structure of a primary OCR source ('observations').
 *
 * For poetic lines, 'observations' typically contains the full line, while 'alt'
 * may contain the line split into two segments, sometimes in reversed order.
 * This function identifies such splits, determines the correct segment order by
 * comparing similarity scores against the full line, and merges them.
 *
 * @param {AlignAndMergeParams} params - The input object containing observations and alt arrays.
 * @returns {TextObservation[]} A new 'alt' array with poetic lines merged to align with 'observations'.
 */

export const alignAndMergeAltPoetry = ({ alt, observations }: Sheet) => {
    // Use the string-based alignment function
    const alignedTexts = alignTextSegments(
        observations.map((obs) => (obs.isPoetic ? obs.text : '')),
        alt.map((altObs) => altObs.text),
    );

    // Convert back to the original object structure
    return alignedTexts.map((text) => {
        // For lines that match original alt text, preserve the original object
        const matchingOriginal = alt.find((altItem) => altItem.text === text);
        return matchingOriginal || { id: getNextId(), text };
    });
};

export const updatePageNumber = (
    state: ManuscriptStateCore,
    startingPageId: number,
    startingPageValue: number,
    cascadeBelow?: boolean,
) => {
    const startingIndex = state.sheets.findIndex((p) => p.page === startingPageId);
    state.sheets[startingIndex].page = startingPageValue;

    if (cascadeBelow) {
        state.sheets.forEach((page, index) => {
            if (index >= startingIndex) {
                const offset = index - startingIndex;
                page.page = startingPageValue + offset;
            }
        });
    }
};
