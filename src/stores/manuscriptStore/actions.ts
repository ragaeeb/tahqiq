import {
    alignAndAdjustObservations,
    calculateDPI,
    mapSuryaBoundingBox,
    mapSuryaPageResultToObservations,
} from 'kokokor';

import type { ManuscriptStateCore, RawInputFiles, Sheet } from './types';

import { assertHasRequiredFiles } from './guards';

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

            const { height: imageHeight, width: imageWidth } = mapSuryaBoundingBox(suryaPage.image_bbox);
            const { x: dpiX, y: dpiY } = calculateDPI(
                { height: imageHeight, width: imageWidth },
                { height: pdfHeight!, width: pdfWidth! },
            );

            const { dpi, horizontal_lines: lines, rectangles } = structures[imageFile];
            const alternateObservations = alignAndAdjustObservations(mapSuryaPageResultToObservations(suryaPage), {
                dpiX,
                dpiY,
                imageWidth: imageWidth,
            }).observations;

            const sheet: Sheet = {
                alternateObservations,
                dpi,
                page: pageNumber,
                ...(lines && { horizontalLines: lines }),
                ...(rectangles && { rectangles }),
                observations: alignAndAdjustObservations(macOCRData.observations, {
                    imageWidth: dpi.width,
                }).observations,
            };

            return sheet;
        })
        .toSorted((a, b) => a.page - b.page);

    return {
        sheets,
    };
};

export const splitAltAtLineBreak = (state: ManuscriptStateCore, page: number, index: number, alt: string) => {
    const newSheets = [...state.sheets];
    const sheetIndex = newSheets.findIndex((s) => s.page === page);
    const sheet = newSheets[sheetIndex];

    const [firstLine, secondLine] = alt.split('\n');
    const altObservation = {
        ...sheet.alternateObservations![index],
        text: firstLine,
    };

    const nextObservation = {
        ...sheet.alternateObservations![index],
        text: secondLine,
    };

    const newAlternateObservations = [
        ...sheet.alternateObservations!.slice(0, index),
        altObservation,
        nextObservation,
        ...sheet.alternateObservations!.slice(index + 1),
    ];

    const newSheet = {
        ...sheet,
        alternateObservations: newAlternateObservations,
    };

    newSheets[sheetIndex] = newSheet;

    return {
        ...state,
        sheets: newSheets,
    };
};

export const mergeWithAbove = (state: ManuscriptStateCore, page: number, index: number) => {
    const newSheets = [...state.sheets];
    const sheetIndex = newSheets.findIndex((s) => s.page === page);

    const sheet = newSheets[sheetIndex];

    console.log('sheet', page, index, sheet);
    console.log('sheet', sheet);

    const above = sheet.alternateObservations[index - 1];
    const current = sheet.alternateObservations[index];

    console.log('above', above);
    console.log('current', current);

    const mergedObservation = {
        ...above,
        text: `${above.text} ${current.text}`.trim(),
    };

    const newAlternateObservations = [
        ...sheet.alternateObservations.slice(0, index - 1),
        mergedObservation,
        ...sheet.alternateObservations.slice(index + 1),
    ];

    const newSheet = {
        ...sheet,
        alternateObservations: newAlternateObservations,
    };

    newSheets[sheetIndex] = newSheet;

    return {
        ...state,
        sheets: newSheets,
    };
};
