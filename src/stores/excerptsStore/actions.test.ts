import { describe, expect, it } from 'bun:test';
import * as actions from './actions';
import type { ExcerptsStateCore } from './types';

const createBaseState = (): ExcerptsStateCore => ({
    collection: undefined,
    contractVersion: undefined,
    createdAt: new Date(),
    excerpts: [],
    footnotes: [],
    headings: [],
    inputFileName: undefined,
    lastUpdatedAt: undefined,
    options: undefined,
    postProcessingApps: [],
    prompt: undefined,
});

describe('excerptsStore actions', () => {
    describe('initStore', () => {
        it('should initialize store from Excerpts data', () => {
            const data = {
                collection: 'test-collection',
                contractVersion: 'v1.0' as const,
                createdAt: new Date().toISOString(),
                excerpts: [{ from: 1, id: 'E1', nass: 'نص', text: 'text' }],
                footnotes: [{ from: 2, id: 'F1', nass: 'حاشية', text: 'footnote' }],
                headings: [{ from: 3, id: 'H1', nass: 'عنوان', text: 'heading' }],
            };

            const result = actions.initStore(data);

            expect(result.collection).toBe('test-collection');
            expect(result.excerpts).toHaveLength(1);
            expect(result.footnotes).toHaveLength(1);
            expect(result.headings).toHaveLength(1);
            expect(result.excerpts[0]?.id).toBe('E1');
        });

        it('should set inputFileName if provided', () => {
            const data = { excerpts: [], footnotes: [], headings: [] };

            const result = actions.initStore(data, 'test-file.json');

            expect(result.inputFileName).toBe('test-file.json');
        });
    });

    describe('updateExcerpt', () => {
        it('should update an existing excerpt', () => {
            const state = createBaseState();
            state.excerpts = [
                { from: 1, id: 'E1', nass: 'نص', text: 'old' },
                { from: 2, id: 'E2', nass: 'نص 2', text: 'text 2' },
            ];

            actions.updateExcerpt(state, 'E1', { text: 'new' });

            expect(state.excerpts[0]?.text).toBe('new');
            expect(state.excerpts[0]?.lastUpdatedAt).toBeDefined();
        });

        it('should not modify state if ID not found', () => {
            const state = createBaseState();
            state.excerpts = [{ from: 1, id: 'E1', nass: 'نص', text: 'old' }];
            const originalLastUpdated = state.lastUpdatedAt;

            actions.updateExcerpt(state, 'nonexistent', { text: 'new' });

            expect(state.excerpts[0]?.text).toBe('old');
            expect(state.lastUpdatedAt).toBe(originalLastUpdated);
        });
    });

    describe('createExcerptFromExisting', () => {
        it('should create a new excerpt from existing one', () => {
            const state = createBaseState();
            state.excerpts = [{ from: 1, id: 'E1', nass: 'الكلمة الأولى الكلمة الثانية', text: 'translation' }];

            actions.createExcerptFromExisting(state, 'E1', 'الكلمة الثانية');

            expect(state.excerpts).toHaveLength(2);
            // Source excerpt should have text removed
            expect(state.excerpts[0]?.nass).toBe('الكلمة الأولى');
            // New excerpt should have the selected text
            expect(state.excerpts[1]?.nass).toBe('الكلمة الثانية');
            // New excerpt should have empty translation
            expect(state.excerpts[1]?.text).toBe('');
            // New excerpt should have new ID
            expect(state.excerpts[1]?.id).toContain('E1');
            expect(state.excerpts[1]?.id).not.toBe('E1');
        });

        it('should add new excerpt ID to filter if filter is active', () => {
            const state = createBaseState();
            state.excerpts = [{ from: 1, id: 'E1', nass: 'نص', text: 'text' }];
            state.filteredExcerptIds = ['E1'];

            actions.createExcerptFromExisting(state, 'E1', 'نص');

            expect(state.filteredExcerptIds).toHaveLength(2);
            expect(state.filteredExcerptIds?.[1]).toContain('E1');
        });

        it('should not modify state if source ID not found', () => {
            const state = createBaseState();
            state.excerpts = [{ from: 1, id: 'E1', nass: 'نص', text: 'text' }];

            actions.createExcerptFromExisting(state, 'nonexistent', 'نص');

            expect(state.excerpts).toHaveLength(1);
        });
    });

    describe('updateHeading', () => {
        it('should update an existing heading', () => {
            const state = createBaseState();
            state.headings = [{ from: 1, id: 'H1', nass: 'عنوان', text: 'old' }];

            actions.updateHeading(state, 'H1', { text: 'new' });

            expect(state.headings[0]?.text).toBe('new');
        });
    });

    describe('updateFootnote', () => {
        it('should update an existing footnote', () => {
            const state = createBaseState();
            state.footnotes = [{ from: 1, id: 'F1', nass: 'حاشية', text: 'old' }];

            actions.updateFootnote(state, 'F1', { text: 'new' });

            expect(state.footnotes[0]?.text).toBe('new');
        });
    });

    describe('deleteExcerpts', () => {
        it('should delete excerpts by IDs', () => {
            const state = createBaseState();
            state.excerpts = [
                { from: 1, id: 'E1', nass: 'نص 1', text: 'text 1' },
                { from: 2, id: 'E2', nass: 'نص 2', text: 'text 2' },
                { from: 3, id: 'E3', nass: 'نص 3', text: 'text 3' },
            ];

            actions.deleteExcerpts(state, ['E1', 'E3']);

            expect(state.excerpts).toHaveLength(1);
            expect(state.excerpts[0]?.id).toBe('E2');
        });
    });

    describe('deleteHeadings', () => {
        it('should delete headings by IDs', () => {
            const state = createBaseState();
            state.headings = [
                { from: 1, id: 'H1', nass: 'عنوان 1', text: 'heading 1' },
                { from: 2, id: 'H2', nass: 'عنوان 2', text: 'heading 2' },
            ];

            actions.deleteHeadings(state, ['H1']);

            expect(state.headings).toHaveLength(1);
            expect(state.headings[0]?.id).toBe('H2');
        });
    });

    describe('deleteFootnotes', () => {
        it('should delete footnotes by IDs', () => {
            const state = createBaseState();
            state.footnotes = [
                { from: 1, id: 'F1', nass: 'حاشية 1', text: 'footnote 1' },
                { from: 2, id: 'F2', nass: 'حاشية 2', text: 'footnote 2' },
            ];

            actions.deleteFootnotes(state, ['F2']);

            expect(state.footnotes).toHaveLength(1);
            expect(state.footnotes[0]?.id).toBe('F1');
        });
    });

    describe('applyTranslationFormatting', () => {
        it('should apply formatting function to all excerpt translations', () => {
            const state = createBaseState();
            state.excerpts = [
                { from: 1, id: 'E1', nass: 'نص', text: 'hello' },
                { from: 2, id: 'E2', nass: 'نص', text: 'world' },
            ];

            actions.applyTranslationFormatting(state, (text) => text.toUpperCase());

            expect(state.excerpts[0]?.text).toBe('HELLO');
            expect(state.excerpts[1]?.text).toBe('WORLD');
        });

        it('should skip excerpts without text', () => {
            const state = createBaseState();
            state.excerpts = [
                { from: 1, id: 'E1', nass: 'نص', text: '' },
                { from: 2, id: 'E2', nass: 'نص', text: 'world' },
            ];

            actions.applyTranslationFormatting(state, (text) => text.toUpperCase());

            expect(state.excerpts[0]?.text).toBe('');
            expect(state.excerpts[1]?.text).toBe('WORLD');
        });
    });

    describe('applyHeadingFormatting', () => {
        it('should apply formatting function to all heading translations', () => {
            const state = createBaseState();
            state.headings = [
                { from: 1, id: 'H1', nass: 'عنوان', text: 'chapter one' },
                { from: 2, id: 'H2', nass: 'عنوان', text: 'chapter two' },
            ];

            actions.applyHeadingFormatting(state, (text) => text.toUpperCase());

            expect(state.headings[0]?.text).toBe('CHAPTER ONE');
            expect(state.headings[1]?.text).toBe('CHAPTER TWO');
        });
    });

    describe('applyFootnoteFormatting', () => {
        it('should apply formatting function to all footnote translations', () => {
            const state = createBaseState();
            state.footnotes = [
                { from: 1, id: 'F1', nass: 'حاشية', text: 'note one' },
                { from: 2, id: 'F2', nass: 'حاشية', text: 'note two' },
            ];

            actions.applyFootnoteFormatting(state, (text) => text.toUpperCase());

            expect(state.footnotes[0]?.text).toBe('NOTE ONE');
            expect(state.footnotes[1]?.text).toBe('NOTE TWO');
        });
    });

    describe('filterExcerptsByIds', () => {
        it('should set filtered excerpt IDs', () => {
            const state = createBaseState();

            actions.filterExcerptsByIds(state, ['E1', 'E2']);

            expect(state.filteredExcerptIds).toEqual(['E1', 'E2']);
        });

        it('should clear filter when undefined is passed', () => {
            const state = createBaseState();
            state.filteredExcerptIds = ['E1', 'E2'];

            actions.filterExcerptsByIds(state, undefined);

            expect(state.filteredExcerptIds).toBeUndefined();
        });
    });

    describe('filterHeadingsByIds', () => {
        it('should set filtered heading IDs', () => {
            const state = createBaseState();

            actions.filterHeadingsByIds(state, ['H1', 'H2']);

            expect(state.filteredHeadingIds).toEqual(['H1', 'H2']);
        });
    });

    describe('filterFootnotesByIds', () => {
        it('should set filtered footnote IDs', () => {
            const state = createBaseState();

            actions.filterFootnotesByIds(state, ['F1', 'F2']);

            expect(state.filteredFootnoteIds).toEqual(['F1', 'F2']);
        });
    });
});
