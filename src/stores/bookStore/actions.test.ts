import { describe, expect, it } from 'bun:test';
import { deletePages, mergeFootnotesWithMatn, shiftValues, updatePages } from './actions';
import type { BookStateCore } from './types';

const createMockState = (overrides: Partial<BookStateCore> = {}): BookStateCore => ({
    createdAt: new Date(),
    isHighlighterEnabled: false,
    postProcessingApps: [],
    selectedVolume: 1,
    volumeToIndex: {},
    volumeToPages: {
        1: [
            { id: 1, lastUpdate: 1000, page: 1, text: 'Page 1 text', volume: 1, volumePage: 1 },
            { id: 2, lastUpdate: 1000, page: 2, text: 'Page 2 text', volume: 1, volumePage: 2 },
            { id: 3, lastUpdate: 1000, page: 3, text: 'Page 3 text', volume: 1, volumePage: 3 },
        ],
    },
    ...overrides,
});

describe('bookStore/actions', () => {
    describe('shiftValues', () => {
        it('should shift page values starting from specified page', () => {
            const state = createMockState();

            const result = shiftValues(state, 2, 10, 'page');

            expect(result.volumeToPages?.[1]?.[0]?.page).toBe(1);
            expect(result.volumeToPages?.[1]?.[1]?.page).toBe(10);
            expect(result.volumeToPages?.[1]?.[2]?.page).toBe(11);
        });

        it('should shift volumePage values', () => {
            const state = createMockState();

            const result = shiftValues(state, 1, 100, 'volumePage');

            expect(result.volumeToPages?.[1]?.[0]?.volumePage).toBe(100);
            expect(result.volumeToPages?.[1]?.[1]?.volumePage).toBe(101);
            expect(result.volumeToPages?.[1]?.[2]?.volumePage).toBe(102);
        });
    });

    describe('updatePages', () => {
        it('should update pages with object payload', () => {
            const state = createMockState();

            const result = updatePages(state, [1, 2], { text: 'Updated text' }, true);

            expect(result.volumeToPages?.[1]?.[0]?.text).toBe('Updated text');
            expect(result.volumeToPages?.[1]?.[1]?.text).toBe('Updated text');
            expect(result.volumeToPages?.[1]?.[2]?.text).toBe('Page 3 text');
        });

        it('should update pages with function payload', () => {
            const state = createMockState();

            const result = updatePages(state, [1], (p) => ({ text: `${p.text} - modified` }), false);

            expect(result.volumeToPages?.[1]?.[0]?.text).toBe('Page 1 text - modified');
        });

        it('should not update pages not in the id list', () => {
            const state = createMockState();

            const result = updatePages(state, [1], { text: 'Changed' });

            expect(result.volumeToPages?.[1]?.[1]?.text).toBe('Page 2 text');
            expect(result.volumeToPages?.[1]?.[2]?.text).toBe('Page 3 text');
        });
    });

    describe('deletePages', () => {
        it('should remove pages by IDs', () => {
            const state = createMockState();

            const result = deletePages(state, [1, 3]);

            expect(result.volumeToPages?.[1]).toHaveLength(1);
            expect(result.volumeToPages?.[1]?.[0]?.id).toBe(2);
        });
    });

    describe('mergeFootnotesWithMatn', () => {
        it('should merge footnotes into page text', () => {
            const state = createMockState({
                volumeToPages: {
                    1: [
                        {
                            footnotes: 'Footnote text',
                            id: 1,
                            lastUpdate: 1000,
                            page: 1,
                            text: 'Main text',
                            volume: 1,
                            volumePage: 1,
                        },
                    ],
                },
            });

            const result = mergeFootnotesWithMatn(state, [1]);

            expect(result.volumeToPages?.[1]?.[0]?.text).toBe('Main text\nFootnote text');
            expect(result.volumeToPages?.[1]?.[0]?.footnotes).toBeUndefined();
        });

        it('should leave text unchanged if no footnotes', () => {
            const state = createMockState();

            const result = mergeFootnotesWithMatn(state, [1]);

            expect(result.volumeToPages?.[1]?.[0]?.text).toBe('Page 1 text');
        });
    });
});
