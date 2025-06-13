import { isBalanced } from 'bitaboom';
import {
    alignAndAdjustObservations,
    buildTextBlocksFromOCR,
    calculateDPI,
    mapSuryaBoundingBox,
    mapSuryaPageResultToObservations,
    mapTextBlocksToParagraphs,
} from 'kokokor';

import { correctReferences } from '@/lib/footnotes';
import { preformatArabicText } from '@/lib/textUtils';

import type { ManuscriptStateCore, Page, RawInputFiles, RawManuscript } from './types';

import { selectCurrentPages } from './selectors';

const compileRawManuscript = (fileNameToData: RawInputFiles): RawManuscript => {
    const fileToObservations = fileNameToData['batch_output.json'];
    const structures = fileNameToData['structures.json'].result;
    const [surya] = Object.values(fileNameToData['surya.json']);
    const [pdfWidth, pdfHeight] = fileNameToData['page_size.txt'].trim().split(' ').map(Number);

    const result = Object.entries(fileToObservations)
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
            const alternateObservations = mapSuryaPageResultToObservations(suryaPage);

            const blocks = buildTextBlocksFromOCR(
                {
                    alternateObservations: alignAndAdjustObservations(alternateObservations, {
                        dpiX,
                        dpiY,
                        imageWidth: imageWidth,
                    }).observations,
                    dpi,
                    ...(lines && { horizontalLines: lines }),
                    ...(rectangles && { rectangles }),
                    observations: macOCRData.observations,
                },
                { log: console.log, typoSymbols: ['ﷺ'] },
            );

            return { blocks, ...(lines && { lines }), ...(rectangles && { rectangles }), page: pageNumber };
        })
        .toSorted((a, b) => a.page - b.page);

    const [struct] = Object.values(structures);

    return {
        createdAt: new Date(),
        data: result,
        metadata: {
            image: { height: struct!.dpi.height, width: struct!.dpi.width },
            pdf: { height: pdfHeight!, width: pdfWidth! },
        },
    };
};

/**
 * Initializes the manuscript store with provided data
 * Organizes manuscripts by volume for easier access
 *
 * @param manuscript - Raw manuscript data containing page information
 * @returns Initial state object for the manuscript store
 */
export const initStore = (fileNameToData: RawInputFiles) => {
    const manuscript = compileRawManuscript(fileNameToData);
    const pages: Page[] = manuscript.data.map(({ blocks, page }) => {
        const correctedBlocks = correctReferences(blocks);
        let text = mapTextBlocksToParagraphs(correctedBlocks, '_');
        text = preformatArabicText(text);
        const errorLines = blocks.flatMap((b, i) =>
            b.isEdited || b.text.includes('()') || !isBalanced(b.text) ? [b.isFootnote ? i + 1 : i] : [],
        );

        return {
            id: page,
            text,
            ...(errorLines.length > 0 && { errorLines }),
        };
    });

    return {
        createdAt: manuscript.createdAt,
        selectedVolume: 1,
        volumeToPages: { 1: pages },
    };
};

/**
 * Selects all pages in the current manuscript or clears selection
 *
 * @param state - Current manuscript state
 * @param isSelected - Boolean indicating whether to select all or clear selection
 * @returns Object with updated selection state
 */
export const selectAllPages = (state: ManuscriptStateCore, isSelected: boolean) => {
    return { selectedPages: isSelected ? selectCurrentPages(state) : [] };
};
