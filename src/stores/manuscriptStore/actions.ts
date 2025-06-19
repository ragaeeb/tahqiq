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

import { AZW_SYMBOL, SWS_SYMBOL } from '@/lib/constants';
import { correctReferences } from '@/lib/footnotes';

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
        observations: observations.map((o) => {
            const layoutInfo = getObservationLayoutInfo(o, {
                horizontalLines: lines,
                imageWidth: dpi.width,
                rectangles,
            });

            return {
                ...o,
                id: ID_COUNTER++,
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
    const sheet = state.sheets.find((s) => s.page === page)!;
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

    sheet.alt.splice(index, 1, altObservation, nextObservation);
};

export const mergeWithAbove = (state: ManuscriptStateCore, page: number, id: number) => {
    const sheet = state.sheets.find((s) => s.page === page)!;
    const index = sheet.observations.findIndex((o) => o.id === id);

    const above = sheet.alt[index - 1];
    const current = sheet.alt[index];

    const mergedObservation = {
        ...above,
        id: ++ID_COUNTER,
        text: `${above.text} ${current.text}`.trim(),
    };

    sheet.alt.splice(index - 1, 2, mergedObservation);
};

export const applySupportToOriginal = (state: ManuscriptStateCore, page: number, id: number) => {
    const sheet = state.sheets.find((s) => s.page === page)!;
    const index = sheet.observations.findIndex((o) => o.id === id);

    sheet.observations[index] = {
        ...sheet.observations[index],
        id: ++ID_COUNTER,
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
                observation.id = ++ID_COUNTER;
                observation.text = fixTypo(observation.text, sheet.alt[index].text, options);
            }
        });
    });
};

export const mergeObservationsToParagraphs = (state: ManuscriptStateCore, page: number) => {
    const sheet = state.sheets.find((s) => s.page === page)!;

    sheet.observations = flattenObservationsToParagraphs(sheet.observations).map((o) => ({
        ...o,
        id: ++ID_COUNTER,
    }));
};

export const setPoetry = (state: ManuscriptStateCore, pageToPoeticIds: Record<number, number[]>) => {
    state.sheets.forEach((sheet) => {
        const ids = pageToPoeticIds[sheet.page];

        if (ids) {
            sheet.observations.forEach((observation) => {
                observation.isPoetic = ids.includes(observation.id);
            });
        }
    });
};

export const autoCorrectFootnotes = (state: ManuscriptStateCore, pages: number[]) => {
    state.sheets.forEach((sheet) => {
        if (pages.includes(sheet.page)) {
            const corrected = correctReferences(sheet.observations);

            if (corrected !== sheet.observations) {
                sheet.observations = corrected.map((o) => ({ ...o, id: ++ID_COUNTER }));
            }
        }
    });
};

export const toggleFootnotes = (state: ManuscriptStateCore, ids: number[]) => {
    state.sheets.forEach((sheet) => {
        sheet.observations.forEach((o) => {
            if (ids.includes(o.id)) {
                o.isFootnote = !Boolean(o.isFootnote);
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
                o.id = ++ID_COUNTER;
            }
        });
    });
};
