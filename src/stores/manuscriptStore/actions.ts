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

    const mistakenReference = blocks.find((b) => b.text.includes('()'));

    if (mistakenReference && referencesInBody.length > referencesInFootnotes.length && referencesInBody.length > 0) {
        const missing = referencesInBody.find((r) => !referencesInFootnotes.includes(r));

        if (missing) {
            mistakenReference.text = mistakenReference.text.replace('()', missing);
        }
    }

    return blocks;
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
        const correctedBlocks = correctReferences(blocks);
        const text = mapTextBlocksToParagraphs(correctedBlocks, '_').replace(/\(\(/g, '«').replace(/\)\)/g, '»');
        const isEdited = blocks.some((b) => b.isEdited) || text.includes('()');

        return {
            id: page,
            text,
            ...(isEdited && { status: 'review' }),
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
