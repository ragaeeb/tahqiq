import { mapTextBlocksToParagraphs, type TextBlock } from 'kokokor';

import type { ManuscriptStateCore, Page, RawManuscript } from './types';

import { selectCurrentPages } from './selectors';

const arabicReferenceRegex = /\([\u0660-\u0669]\)/g;
const arabicFootnoteReferenceRegex = /^\([\u0660-\u0669]\)/g;

const correctReferences = (blocks: TextBlock[]) => {
    const referencesInBody = blocks
        .filter((b) => !b.isFootnote)
        .flatMap((b) => {
            return b.text.match(arabicReferenceRegex) || [];
        });

    const referencesInFootnotes = blocks
        .filter((b) => b.isFootnote)
        .flatMap((b) => {
            return b.text.match(arabicFootnoteReferenceRegex) || [];
        });

    const mistakenReferences = blocks.filter((b) => b.text.includes('()'));

    if (
        mistakenReferences.length > 0 &&
        referencesInBody.length > referencesInFootnotes.length &&
        referencesInBody.length > 0
    ) {
        for (const mistakenReference of mistakenReferences) {
            const missing = referencesInBody.find((r) => !referencesInFootnotes.includes(r));

            if (missing) {
                mistakenReference.text = mistakenReference.text.replace('()', missing);
                referencesInBody.shift();
            }
        }
    }

    return blocks;
};

const standardizeHijriSymbol = (text: string): string => {
    // Replace standalone ه with هـ when it appears after Arabic digits (0-9 or ٠-٩) with up to 1 space in between
    return text.replace(/([\u0660-\u0669])\s?ه(?=\s|$|[^\u0600-\u06FF])/g, '$1 هـ');
};

/**
 * Initializes the transcript store with provided data
 * Organizes transcripts by volume for easier access
 *
 * @param data - Transcript series data containing transcript information
 * @returns Initial state object for the transcript store
 */
export const initStore = (manuscript: RawManuscript) => {
    const pages: Page[] = manuscript.data.map(({ blocks, page }) => {
        console.log('page', page);
        const correctedBlocks = correctReferences(blocks);
        let text = mapTextBlocksToParagraphs(correctedBlocks, '_').replace(/\(\(/g, '«').replace(/\)\)/g, '»');
        text = standardizeHijriSymbol(text);
        const errorLines = blocks.flatMap((b, i) => (b.isEdited || b.text.includes('()') ? [i] : []));

        return {
            id: page,
            text,
            ...(errorLines.length > 0 && { errorLines }),
        };
    });

    return {
        createdAt: manuscript.createdAt,
        selectedVolume: 1,
        urlTemplate: manuscript.urlTemplate || '',
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
