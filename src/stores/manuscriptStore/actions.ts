import { mapTextBlocksToParagraphs } from 'kokokor';

import type { RawManuscript } from './types';

/**
 * Initializes the transcript store with provided data
 * Organizes transcripts by volume for easier access
 *
 * @param data - Transcript series data containing transcript information
 * @returns Initial state object for the transcript store
 */
export const initStore = (manuscript: RawManuscript) => {
    const pages = manuscript.data.map(({ blocks, page }) => {
        return { id: page, text: mapTextBlocksToParagraphs(blocks, '_') };
    });

    return {
        createdAt: manuscript.createdAt,
        selectedVolume: 1,
        volumeToPages: { 1: pages },
    };
};
