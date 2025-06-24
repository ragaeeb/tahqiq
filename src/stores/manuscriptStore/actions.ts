import { fixTypo } from 'baburchi';
import {
    calculateDPI,
    flipAndAlignObservations,
    mapMatrixToBoundingBox,
    mapObservationsToTextLines,
    type Observation,
} from 'kokokor';

import { AZW_SYMBOL, SWS_SYMBOL } from '@/lib/constants';
import { correctReferences } from '@/lib/footnotes';

import type { ManuscriptStateCore, RawInputFiles, Sheet, StructureMetadata, SuryaPageOcrResult } from './types';

import { assertHasRequiredFiles } from './guards';

let ID_COUNTER = 0;

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

    const altObservations = alternateObservations.map((o) => ({ id: ID_COUNTER++, text: o.text }));

    return {
        alt: altObservations,
        observations: textLines.map((o) => {
            return {
                ...o,
                id: ID_COUNTER++,
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

    return {
        sheets,
    };
};

export const splitAltAtLineBreak = (state: ManuscriptStateCore, page: number, id: number, alt: string) => {
    const sheet = state.sheets.find((s) => s.page === page)!;
    const index = sheet.observations.findIndex((o) => o.id === id);

    const [firstLine, secondLine] = alt.split('\n');
    const altObservation = {
        ...sheet.alt[index],
        lastUpdate: Date.now(),
        text: firstLine,
    };

    const nextObservation = {
        ...sheet.alt[index],
        id: ++ID_COUNTER,
        lastUpdate: Date.now(),
        text: secondLine,
    };

    sheet.alt.splice(index, 1, altObservation, nextObservation);
};

export const mergeWithAbove = (state: ManuscriptStateCore, page: number, id: number) => {
    const sheet = state.sheets.find((s) => s.page === page)!;
    const index = sheet.observations.findIndex((o) => o.id === id);

    const above = sheet.alt[index - 1];
    const current = sheet.alt[index];

    const mergedObservation = {
        ...above,
        lastUpdate: Date.now(),
        text: `${above.text} ${current.text}`.trim(),
    };

    sheet.alt.splice(index - 1, 2, mergedObservation);
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

export const setPoetry = (state: ManuscriptStateCore, ids: number[], isPoetry: boolean) => {
    state.sheets.forEach((sheet) => {
        sheet.observations.forEach((observation) => {
            if (ids.includes(observation.id)) {
                observation.isPoetic = isPoetry;
            }
        });
    });
};

export const autoCorrectFootnotes = (state: ManuscriptStateCore, pages: number[]) => {
    state.sheets.forEach((sheet) => {
        if (pages.includes(sheet.page)) {
            const corrected = correctReferences(sheet.observations);

            if (corrected !== sheet.observations) {
                sheet.observations = corrected.map((o) => ({ ...o, lastUpdate: Date.now() }));
            }
        }
    });
};

export const toggleFootnotes = (state: ManuscriptStateCore, ids: number[]) => {
    state.sheets.forEach((sheet) => {
        sheet.observations.forEach((o) => {
            if (ids.includes(o.id)) {
                o.isFootnote = !o.isFootnote;
            }
        });
    });
};

export const updateText = (state: ManuscriptStateCore, page: number, id: number, text: string) => {
    const sheet = state.sheets.find((s) => s.page === page)!;
    const observation = sheet.observations.find((o) => o.id === id)!;

    observation.text = text;
};

export const replaceHonorifics = (state: ManuscriptStateCore, ids: number[], from = SWS_SYMBOL, to = AZW_SYMBOL) => {
    state.sheets.forEach((sheet) => {
        sheet.observations.forEach((o) => {
            if (ids.includes(o.id)) {
                o.text = o.text.replaceAll(from, to);
                o.lastUpdate = Date.now();
            }
        });
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
    const pages = new Set(pagesToFilterBy);

    state.sheets.forEach((sheet) => {
        if (pages.has(sheet.page)) {
            sheet.observations.forEach((o) => {
                idsFilter.add(o.id);
            });
        }
    });

    return { idsFilter };
};
