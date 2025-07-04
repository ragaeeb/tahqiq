import type { BookStateCore, Kitab } from '@/stores/bookStore/types';

import packageJson from '@/../package.json';

import { FOOTNOTES_DELIMITER, LatestContractVersion } from './constants';

/**
 * Maps the internal book state to the standardized Kitab format.
 *
 * This function transforms the internal book store state into a contract-compliant
 * Kitab structure that can be persisted or exported. It flattens the volume-based
 * organization into a single collection of pages and bookmarks.
 *
 * @param state - The current book store state containing volume-organized data
 * @returns A Kitab object with the latest contract version and flattened structure
 *
 * @example
 * ```typescript
 * const bookState = {
 *   createdAt: new Date('2023-01-01'),
 *   selectedVolume: 1,
 *   volumeToIndex: {
 *     1: [{ id: 1, page: 1, title: 'Chapter 1' }],
 *     2: [{ id: 2, page: 50, title: 'Chapter 2' }]
 *   },
 *   volumeToPages: {
 *     1: [{ id: 1, page: 1, text: 'Content', volume: 1, lastUpdate: Date.now() }]
 *   }
 * };
 *
 * const kitab = mapBookStateToKitab(bookState);
 * // Returns: { contractVersion: 'v1.0', type: 'book', pages: [...], index: [...] }
 * ```
 */
export const mapBookStateToKitab = (state: BookStateCore): Kitab => {
    return {
        contractVersion: LatestContractVersion.Book,
        createdAt: state.createdAt,
        index: Object.entries(state.volumeToIndex)
            .flatMap(([volume, bookmarks]) => {
                return bookmarks.map((b) => ({ page: b.page, title: b.title, volume: Number(volume) }));
            })
            .sort((a, b) => a.page - b.page),
        lastUpdatedAt: new Date(),
        pages: Object.entries(state.volumeToPages).flatMap(([, pages]) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            return pages.map(({ hasHeader, id, lastUpdate, ...p }) => ({ ...p }));
        }),
        postProcessingApps: state.postProcessingApps.concat({
            id: packageJson.name,
            timestamp: new Date(),
            version: packageJson.version,
        }),
        type: 'book',
    };
};

/**
 * Converts a Kitab object to the legacy format structure.
 *
 * This function transforms the modern Kitab format into a legacy format that
 * may be required for backwards compatibility or integration with older systems.
 * It restructures the data and combines text content with footnotes.
 *
 * @param kitab - The Kitab object to convert to legacy format
 * @returns An object with bookmarks and pages in legacy format structure
 *
 * @example
 * ```typescript
 * const kitab = {
 *   contractVersion: 'v1.0',
 *   type: 'book',
 *   index: [{ page: 1, title: 'Chapter 1', volume: 1 }],
 *   pages: [{
 *     page: 1,
 *     text: 'Main content',
 *     footnotes: 'Footnote text',
 *     volume: 1,
 *     volumePage: 1
 *   }],
 *   createdAt: new Date(),
 *   lastUpdatedAt: new Date()
 * };
 *
 * const legacy = mapKitabToLegacyFormat(kitab);
 * // Returns: {
 * //   bookmarks: [{ page: 1, title: 'Chapter 1', volume: 1 }],
 * //   pages: [{ body: 'Main content_\nFootnote text', page: 1, part: 1, pp: 1 }]
 * // }
 * ```
 */
export const mapKitabToLegacyFormat = (kitab: Kitab) => {
    return {
        bookmarks: kitab.index,
        pages: kitab.pages
            .filter((p) => p.page)
            .map((p) => ({
                body: [p.text, p.footnotes]
                    .filter(Boolean)
                    .map((t) => t!.trim())
                    .join(FOOTNOTES_DELIMITER),
                page: p.page,
                part: p.volume,
                pp: p.volumePage,
            })),
    };
};
