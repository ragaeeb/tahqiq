import { mapTextBlocksToParagraphs } from 'kokokor';

import { correctReferences } from '@/lib/footnotes';
import { isBalanced, preformatArabicText } from '@/lib/textUtils';

import type { ManuscriptStateCore, Page, RawManuscript } from './types';

import { selectCurrentPages } from './selectors';

/**
 * Initializes the manuscript store with provided data
 * Organizes manuscripts by volume for easier access
 *
 * @param manuscript - Raw manuscript data containing page information
 * @returns Initial state object for the manuscript store
 */
export const initStore = (manuscript: RawManuscript) => {
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
