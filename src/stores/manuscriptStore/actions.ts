import { correctReferences, fixTypo } from 'baburchi';
import {
    calculateDPI,
    flipAndAlignObservations,
    mapMatrixToBoundingBox,
    mapObservationsToTextLines,
    type Observation,
} from 'kokokor';
import { rawReturn } from 'mutative';

import { getNextId } from '@/lib/common';
import { AZW_SYMBOL, SWS_SYMBOL } from '@/lib/constants';

import type {
    ManuscriptStateCore,
    RawInputFiles,
    Sheet,
    StructureMetadata,
    SuryaPageOcrResult,
    TextLine,
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

    const altObservations = alternateObservations.map((o) => ({ id: getNextId(), text: o.text }));

    return {
        alt: altObservations,
        observations: textLines.map((o) => {
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
        .filter(([, macOCRData]) => macOCRData.observations.length > 0)
        .map(([imageFile, macOCRData]) => {
            const pageNumber = parseInt(imageFile.split('.')[0]!);
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
        .filter((s) => s.observations.length > 0)
        .toSorted((a, b) => a.page - b.page);

    return rawReturn({
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

    const above = sheet.alt[index - 1];
    const current = sheet.alt[index];

    const mergedAlt = {
        ...above,
        lastUpdate: Date.now(),
        text: `${above.text} ${current.text}`.trim(),
    };

    sheet.alt.splice(index - 1, 2, mergedAlt);

    if (mergeAsl) {
        const aboveObservation = sheet.observations[index - 1];
        const currentObservation = sheet.observations[index];

        const mergedObservation = {
            ...aboveObservation,
            lastUpdate: Date.now(),
            text: `${aboveObservation.text} ${currentObservation.text}`.trim(),
        };

        sheet.observations.splice(index - 1, 2, mergedObservation);
    }
};

export const applySupportToOriginal = (state: ManuscriptStateCore, page: number, id: number) => {
    const sheet = state.sheets.find((s) => s.page === page)!;
    const index = sheet.observations.findIndex((o) => o.id === id);

    sheet.observations[index] = {
        ...sheet.observations[index],
        lastUpdate: Date.now(),
        text: sheet.alt[index].text,
    };
};

export const deleteSupport = (state: ManuscriptStateCore, page: number, id: number) => {
    const sheet = state.sheets.find((s) => s.page === page)!;
    const index = sheet.observations.findIndex((o) => o.id === id);

    sheet.alt.splice(index, 1);
};

export const fixTypos = (state: ManuscriptStateCore, ids: number[]) => {
    const idsSet = new Set(ids);
    const options = { typoSymbols: [SWS_SYMBOL] };

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

export const updateText = (state: ManuscriptStateCore, page: number, id: number, text: string) => {
    updateTextLines(state, [id], { text }, false);
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
    payload: ((o: TextLine) => void) | Omit<Partial<TextLine>, 'id' | 'lastUpdate'>,
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

export const replaceHonorifics = (state: ManuscriptStateCore, ids: number[], from = SWS_SYMBOL, to = AZW_SYMBOL) => {
    updateTextLines(state, ids, (o) => {
        o.text = o.text.replaceAll(from, to);
    });
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
