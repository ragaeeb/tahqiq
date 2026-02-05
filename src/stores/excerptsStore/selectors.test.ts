import { describe, expect, it } from 'bun:test';
import {
    selectAllExcerpts,
    selectAllFootnotes,
    selectAllHeadings,
    selectExcerptCount,
    selectFootnoteCount,
    selectHeadingCount,
} from './selectors';
import type { ExcerptsState } from './types';

const createMockState = (overrides: Partial<ExcerptsState> = {}): ExcerptsState =>
    ({
        applyBulkTranslations: () => {
            return { total: 0, updated: 0 };
        },
        applyExcerptNassFormatting: () => {},
        applyFootnoteFormatting: () => {},
        applyFootnoteNassFormatting: () => {},
        applyHeadingFormatting: () => {},
        applyHeadingNassFormatting: () => {},
        applyTranslationFormatting: () => {},
        collection: undefined,
        contractVersion: 'v1.0',
        createdAt: Date.now(),
        createExcerptFromExisting: () => {},
        deleteExcerpts: () => {},
        deleteFootnotes: () => {},
        deleteHeadings: () => {},
        excerpts: [],
        filterExcerptsByIds: () => {},
        filterFootnotesByIds: () => {},
        filterHeadingsByIds: () => {},
        footnotes: [],
        headings: [],
        init: () => {},
        inputFileName: undefined,
        lastUpdatedAt: Date.now(),
        markAsSentToLlm: () => {},
        mergeExcerpts: () => false,
        options: { breakpoints: [], maxPages: 0, minWordsPerSegment: 5, replace: [], rules: [] },
        postProcessingApps: [],
        promptForTranslation: undefined,
        promptId: undefined,
        reset: () => {},
        resetSentToLlm: () => {},
        save: async () => true,
        updateExcerpt: () => {},
        updateFootnote: () => {},
        updateHeading: () => {},
        ...overrides,
    }) as unknown as ExcerptsState;

describe('excerptsStore selectors', () => {
    describe('selectAllExcerpts', () => {
        it('should return all excerpts when no filter is active', () => {
            const excerpts = [
                { from: 1, id: 'E1', lastUpdatedAt: 12345, nass: 'نص 1', text: 'text 1', translator: 890 },
                { from: 2, id: 'E2', lastUpdatedAt: 12345, nass: 'نص 2', text: 'text 2', translator: 890 },
            ];
            const state = createMockState({ excerpts });

            const result = selectAllExcerpts(state);

            expect(result).toBe(excerpts);
        });

        it('should return filtered excerpts when filter is active', () => {
            const excerpts = [
                { from: 1, id: 'E1', lastUpdatedAt: 12345, nass: 'نص 1', text: 'text 1', translator: 890 },
                { from: 2, id: 'E2', lastUpdatedAt: 12345, nass: 'نص 2', text: 'text 2', translator: 890 },
                { from: 3, id: 'E3', lastUpdatedAt: 12345, nass: 'نص 3', text: 'text 3', translator: 890 },
            ];
            const state = createMockState({ excerpts, filteredExcerptIds: ['E1', 'E3'] });

            const result = selectAllExcerpts(state);

            expect(result).toHaveLength(2);
            expect(result[0]?.id).toBe('E1');
            expect(result[1]?.id).toBe('E3');
        });

        it('should return empty array when filter matches no excerpts', () => {
            const excerpts = [
                { from: 1, id: 'E1', lastUpdatedAt: 12345, nass: 'نص 1', text: 'text 1', translator: 890 },
            ];
            const state = createMockState({ excerpts, filteredExcerptIds: ['nonexistent'] });

            const result = selectAllExcerpts(state);

            expect(result).toHaveLength(0);
        });

        it('should memoize results for same state reference', () => {
            const excerpts = [
                { from: 1, id: 'E1', lastUpdatedAt: 12345, nass: 'نص 1', text: 'text 1', translator: 890 },
            ];
            const state = createMockState({ excerpts });

            const result1 = selectAllExcerpts(state);
            const result2 = selectAllExcerpts(state);

            expect(result1).toBe(result2);
        });
    });

    describe('selectAllHeadings', () => {
        it('should return all headings when no filter is active', () => {
            const headings = [
                { from: 1, id: 'H1', lastUpdatedAt: 12345, nass: 'عنوان 1', text: 'heading 1', translator: 890 },
                { from: 2, id: 'H2', lastUpdatedAt: 12345, nass: 'عنوان 2', text: 'heading 2', translator: 890 },
            ];
            const state = createMockState({ headings });

            const result = selectAllHeadings(state);

            expect(result).toBe(headings);
        });

        it('should return filtered headings when filter is active', () => {
            const headings = [
                { from: 1, id: 'H1', lastUpdatedAt: 12345, nass: 'عنوان 1', text: 'heading 1', translator: 890 },
                { from: 2, id: 'H2', lastUpdatedAt: 12345, nass: 'عنوان 2', text: 'heading 2', translator: 890 },
            ];
            const state = createMockState({ filteredHeadingIds: ['H2'], headings });

            const result = selectAllHeadings(state);

            expect(result).toHaveLength(1);
            expect(result[0]?.id).toBe('H2');
        });
    });

    describe('selectAllFootnotes', () => {
        it('should return all footnotes when no filter is active', () => {
            const footnotes = [
                { from: 1, id: 'F1', lastUpdatedAt: 12345, nass: 'حاشية 1', text: 'footnote 1', translator: 890 },
                { from: 2, id: 'F2', lastUpdatedAt: 12345, nass: 'حاشية 2', text: 'footnote 2', translator: 890 },
            ];
            const state = createMockState({ footnotes });

            const result = selectAllFootnotes(state);

            expect(result).toBe(footnotes);
        });

        it('should return filtered footnotes when filter is active', () => {
            const footnotes = [
                { from: 1, id: 'F1', lastUpdatedAt: 12345, nass: 'حاشية 1', text: 'footnote 1', translator: 890 },
                { from: 2, id: 'F2', lastUpdatedAt: 12345, nass: 'حاشية 2', text: 'footnote 2', translator: 890 },
            ];
            const state = createMockState({ filteredFootnoteIds: ['F1'], footnotes });

            const result = selectAllFootnotes(state);

            expect(result).toHaveLength(1);
            expect(result[0]?.id).toBe('F1');
        });
    });

    describe('selectExcerptCount', () => {
        it('should return total excerpt count (unfiltered)', () => {
            const excerpts = [
                { from: 1, id: 'E1', lastUpdatedAt: 12345, nass: 'نص 1', text: 'text 1', translator: 890 },
                { from: 2, id: 'E2', lastUpdatedAt: 12345, nass: 'نص 2', text: 'text 2', translator: 890 },
            ];
            const state = createMockState({
                excerpts,
                filteredExcerptIds: ['E1'], // Filter only one
            });

            const result = selectExcerptCount(state);

            expect(result).toBe(2); // Should return total, not filtered
        });
    });

    describe('selectHeadingCount', () => {
        it('should return total heading count (unfiltered)', () => {
            const headings = [
                { from: 1, id: 'H1', lastUpdatedAt: 12345, nass: 'عنوان 1', text: 'heading 1', translator: 890 },
                { from: 2, id: 'H2', lastUpdatedAt: 12345, nass: 'عنوان 2', text: 'heading 2', translator: 890 },
                { from: 3, id: 'H3', lastUpdatedAt: 12345, nass: 'عنوان 3', text: 'heading 3', translator: 890 },
            ];
            const state = createMockState({ headings });

            const result = selectHeadingCount(state);

            expect(result).toBe(3);
        });
    });

    describe('selectFootnoteCount', () => {
        it('should return total footnote count (unfiltered)', () => {
            const footnotes = [
                { from: 1, id: 'F1', lastUpdatedAt: 12345, nass: 'حاشية 1', text: 'footnote 1', translator: 890 },
            ];
            const state = createMockState({ footnotes });

            const result = selectFootnoteCount(state);

            expect(result).toBe(1);
        });
    });
});
