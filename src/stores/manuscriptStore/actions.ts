import {
    alignAndAdjustObservations,
    calculateDPI,
    fixTypo,
    flattenObservationsToParagraphs,
    getObservationLayoutInfo,
    isPoeticLayout,
    mapSuryaBoundingBox,
    mapSuryaPageResultToObservations,
    type Observation,
    type SuryaPageOcrResult,
} from 'kokokor';

import { SWS_SYMBOL } from '@/lib/constants';

import type { ManuscriptStateCore, RawInputFiles, Sheet, StructureMetadata } from './types';

import { assertHasRequiredFiles } from './guards';

let ID_COUNTER = 0;

const filterNoisyObservations = (o: Observation) => o.text?.length > 1;

const createSheet = (
    page: number,
    macObservations: Observation[],
    alternateObservations: Observation[],
    { dpi, horizontal_lines: lines, rectangles }: StructureMetadata,
): Sheet => {
    const { groups, observations } = alignAndAdjustObservations(macObservations.filter(filterNoisyObservations), {
        imageWidth: dpi.width,
    });

    const altObservations = alternateObservations.map((o) => ({ id: ID_COUNTER++, text: o.text }));
    const isPoetic = isPoeticLayout(groups);

    return {
        alt: altObservations,
        dpi,
        horizontalLines: lines,
        observations: observations.map(({ confidence, ...o }) => {
            const layoutInfo = getObservationLayoutInfo(o, {
                horizontalLines: lines,
                imageWidth: dpi.width,
                rectangles,
            });

            return {
                ...o,
                id: ID_COUNTER++,
                isMerged: Boolean(confidence && confidence < 1),
                isPoetic,
                ...layoutInfo,
            };
        }),
        page,
        rectangles,
    };
};

const getSuryaObservations = (suryaPage: SuryaPageOcrResult, pdfWidth: number, pdfHeight: number) => {
    const { height: imageHeight, width: imageWidth } = mapSuryaBoundingBox(suryaPage.image_bbox);
    const { x: dpiX, y: dpiY } = calculateDPI(
        { height: imageHeight, width: imageWidth },
        { height: pdfHeight, width: pdfWidth },
    );

    const alternateObservations = alignAndAdjustObservations(mapSuryaPageResultToObservations(suryaPage), {
        dpiX,
        dpiY,
        imageWidth,
    }).observations.filter(filterNoisyObservations);

    return alternateObservations;
};

/**
 * Initializes the manuscript store with provided data
 * Organizes manuscripts by volume for easier access
 *
 * @param manuscript - Raw manuscript data containing page information
 * @returns Initial state object for the manuscript store
 */
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
    const newSheets = [...state.sheets];
    const sheetIndex = newSheets.findIndex((s) => s.page === page);
    const sheet = newSheets[sheetIndex];
    const index = sheet.observations.findIndex((o) => o.id === id);

    const [firstLine, secondLine] = alt.split('\n');
    const altObservation = {
        ...sheet.alt[index],
        id: ++ID_COUNTER,
        text: firstLine,
    };

    const nextObservation = {
        ...sheet.alt[index],
        id: ++ID_COUNTER,
        text: secondLine,
    };

    const newAlternateObservations = [
        ...sheet.alt.slice(0, index),
        altObservation,
        nextObservation,
        ...sheet.alt.slice(index + 1),
    ];

    newSheets[sheetIndex] = {
        ...sheet,
        alt: newAlternateObservations,
    };

    return {
        ...state,
        sheets: newSheets,
    };
};

export const mergeWithAbove = (state: ManuscriptStateCore, page: number, id: number) => {
    const newSheets = [...state.sheets];
    const sheetIndex = newSheets.findIndex((s) => s.page === page);
    const sheet = newSheets[sheetIndex];
    const index = sheet.observations.findIndex((o) => o.id === id);

    const above = sheet.alt[index - 1];
    const current = sheet.alt[index];

    const mergedObservation = {
        ...above,
        id: ++ID_COUNTER,
        text: `${above.text} ${current.text}`.trim(),
    };

    const newAlternateObservations = [
        ...sheet.alt.slice(0, index - 1),
        mergedObservation,
        ...sheet.alt.slice(index + 1),
    ];

    newSheets[sheetIndex] = {
        ...sheet,
        alt: newAlternateObservations,
    };

    return {
        ...state,
        sheets: newSheets,
    };
};

export const applySupportToOriginal = (state: ManuscriptStateCore, page: number, id: number) => {
    const newSheets = [...state.sheets];
    const sheetIndex = newSheets.findIndex((s) => s.page === page);
    const sheet = newSheets[sheetIndex];
    const index = sheet.observations.findIndex((o) => o.id === id);
    const updatedObservation = { ...sheet.observations[index], id: ++ID_COUNTER, text: sheet.alt[index].text };

    const newObservations = [
        ...sheet.observations.slice(0, index),
        updatedObservation,
        ...sheet.observations.slice(index + 1),
    ];

    newSheets[sheetIndex] = {
        ...sheet,
        observations: newObservations,
    };

    return {
        ...state,
        sheets: newSheets,
    };
};

export const fixTypos = (state: ManuscriptStateCore, ids: number[]) => {
    const idsSet = new Set(ids);
    const options = { typoSymbols: [SWS_SYMBOL] };

    const newSheets = state.sheets.map((sheet) => {
        const newObservations = sheet.observations.map((observation, index) => {
            if (idsSet.has(observation.id)) {
                return {
                    ...observation,
                    id: ++ID_COUNTER,
                    text: fixTypo(observation.text, sheet.alt[index].text, options),
                };
            }

            // Return unchanged observation if not in ids list or no alt text available
            return observation;
        });

        // Only create a new sheet object if observations actually changed
        if (newObservations.some((obs, index) => obs !== sheet.observations[index])) {
            return {
                ...sheet,
                observations: newObservations,
            };
        }

        return sheet;
    });

    return {
        ...state,
        sheets: newSheets,
    };
};

export const mergeObservationsToParagraphs = (state: ManuscriptStateCore, page: number) => {
    const sheetIndex = state.sheets.findIndex((s) => s.page === page)!;
    const newSheet = {
        ...state.sheets[sheetIndex],
        observations: flattenObservationsToParagraphs(state.sheets[sheetIndex].observations).map((o) => ({
            ...o,
            id: ++ID_COUNTER,
        })),
    };
    const sheets = [...state.sheets];
    sheets[sheetIndex] = newSheet;

    return { sheets };
};

export const setPoetry = (state: ManuscriptStateCore, pageToPoeticIds: Record<number, number[]>) => {
    const sheets = [...state.sheets];

    for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        const ids = pageToPoeticIds[sheet.page];

        if (ids) {
            const observations = sheet.observations.map((o) => ({
                ...o,
                isPoetic: ids.includes(o.id),
            }));

            sheets[i] = { ...sheet, observations };
        }
    }

    return { sheets };
};
