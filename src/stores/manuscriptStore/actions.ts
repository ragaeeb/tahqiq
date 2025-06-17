import {
    alignAndAdjustObservations,
    calculateDPI,
    mapSuryaBoundingBox,
    mapSuryaPageResultToObservations,
    type Observation,
    type SuryaPageOcrResult,
} from 'kokokor';

import type { ManuscriptStateCore, RawInputFiles, Sheet, StructureMetadata } from './types';

import { assertHasRequiredFiles } from './guards';

let ID_COUNTER = 0;

const createSheet = (
    page: number,
    observations: Observation[],
    alternateObservations: Observation[],
    { dpi, horizontal_lines: lines, rectangles }: StructureMetadata,
): Sheet => {
    const altObservations = alternateObservations.map((o) => ({ id: ID_COUNTER++, text: o.text }));

    return {
        alt: altObservations,
        dpi,
        horizontalLines: lines,
        observations: observations
            .map((o, i) => {
                const alt = altObservations[i].text;

                return {
                    ...o,
                    hasInvalidFootnotes: Boolean(o.text?.includes('()')),
                    id: ID_COUNTER++,
                    includesHonorifics: Boolean(alt?.includes('ﷺ')),
                    isMerged: Boolean(o.confidence && o.confidence < 1),
                };
            })
            .filter((o) => o.text),
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
    }).observations.filter((o) => o.text?.length > 1);

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

            const observations = alignAndAdjustObservations(macOCRData.observations, {
                imageWidth: structures[imageFile].dpi.width,
            }).observations;

            const sheet = createSheet(pageNumber, observations, alternateObservations, structures[imageFile]);

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
