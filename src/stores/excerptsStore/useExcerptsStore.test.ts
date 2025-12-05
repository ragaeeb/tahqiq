import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import { resetExcerptsStoreState } from '@/test-utils/excerptsStore';

describe('useExcerptsStore', () => {
    beforeEach(() => {
        resetExcerptsStoreState();
    });

    afterEach(() => {
        resetExcerptsStoreState();
    });

    describe('init', () => {
        it('should initialize store with provided data', () => {
            const data = {
                collection: 'test-collection',
                excerpts: [{ from: 1, id: 'E1', nass: 'نص', text: 'text' }],
                footnotes: [{ from: 2, id: 'F1', nass: 'حاشية', text: 'footnote' }],
                headings: [{ from: 3, id: 'H1', nass: 'عنوان', text: 'heading' }],
            };

            useExcerptsStore.getState().init(data);

            const state = useExcerptsStore.getState();
            expect(state.collection).toBe('test-collection');
            expect(state.excerpts).toHaveLength(1);
            expect(state.footnotes).toHaveLength(1);
            expect(state.headings).toHaveLength(1);
        });

        it('should set inputFileName if provided', () => {
            const data = { excerpts: [], footnotes: [], headings: [] };

            useExcerptsStore.getState().init(data, 'test-file.json');

            expect(useExcerptsStore.getState().inputFileName).toBe('test-file.json');
        });
    });

    describe('updateExcerpt', () => {
        it('should update an existing excerpt', () => {
            useExcerptsStore.setState({ excerpts: [{ from: 1, id: 'E1', nass: 'نص', text: 'old' }] });

            useExcerptsStore.getState().updateExcerpt('E1', { text: 'new' });

            const state = useExcerptsStore.getState();
            expect(state.excerpts[0]?.text).toBe('new');
        });
    });

    describe('createExcerptFromExisting', () => {
        it('should create a new excerpt from existing one', () => {
            useExcerptsStore.setState({
                excerpts: [{ from: 1, id: 'E1', nass: 'الكلمة الأولى', text: 'translation' }],
            });

            useExcerptsStore.getState().createExcerptFromExisting('E1', 'الكلمة');

            const state = useExcerptsStore.getState();
            expect(state.excerpts).toHaveLength(2);
            // Source should have extracted text removed
            expect(state.excerpts[0]?.nass).toBe('الأولى');
            // New excerpt should have selected text
            expect(state.excerpts[1]?.nass).toBe('الكلمة');
            expect(state.excerpts[1]?.text).toBe('');
        });
    });

    describe('updateHeading', () => {
        it('should update an existing heading', () => {
            useExcerptsStore.setState({ headings: [{ from: 1, id: 'H1', nass: 'عنوان', text: 'old' }] });

            useExcerptsStore.getState().updateHeading('H1', { text: 'new' });

            expect(useExcerptsStore.getState().headings[0]?.text).toBe('new');
        });
    });

    describe('updateFootnote', () => {
        it('should update an existing footnote', () => {
            useExcerptsStore.setState({ footnotes: [{ from: 1, id: 'F1', nass: 'حاشية', text: 'old' }] });

            useExcerptsStore.getState().updateFootnote('F1', { text: 'new' });

            expect(useExcerptsStore.getState().footnotes[0]?.text).toBe('new');
        });
    });

    describe('deleteExcerpts', () => {
        it('should delete excerpts by IDs', () => {
            useExcerptsStore.setState({
                excerpts: [
                    { from: 1, id: 'E1', nass: 'نص 1', text: 'text 1' },
                    { from: 2, id: 'E2', nass: 'نص 2', text: 'text 2' },
                ],
            });

            useExcerptsStore.getState().deleteExcerpts(['E1']);

            const state = useExcerptsStore.getState();
            expect(state.excerpts).toHaveLength(1);
            expect(state.excerpts[0]?.id).toBe('E2');
        });
    });

    describe('deleteHeadings', () => {
        it('should delete headings by IDs', () => {
            useExcerptsStore.setState({
                headings: [
                    { from: 1, id: 'H1', nass: 'عنوان 1', text: 'heading 1' },
                    { from: 2, id: 'H2', nass: 'عنوان 2', text: 'heading 2' },
                ],
            });

            useExcerptsStore.getState().deleteHeadings(['H1']);

            expect(useExcerptsStore.getState().headings).toHaveLength(1);
        });
    });

    describe('deleteFootnotes', () => {
        it('should delete footnotes by IDs', () => {
            useExcerptsStore.setState({
                footnotes: [
                    { from: 1, id: 'F1', nass: 'حاشية 1', text: 'footnote 1' },
                    { from: 2, id: 'F2', nass: 'حاشية 2', text: 'footnote 2' },
                ],
            });

            useExcerptsStore.getState().deleteFootnotes(['F2']);

            expect(useExcerptsStore.getState().footnotes).toHaveLength(1);
        });
    });

    describe('applyTranslationFormatting', () => {
        it('should apply formatting to all excerpt translations', () => {
            useExcerptsStore.setState({
                excerpts: [
                    { from: 1, id: 'E1', nass: 'نص', text: 'hello' },
                    { from: 2, id: 'E2', nass: 'نص', text: 'world' },
                ],
            });

            useExcerptsStore.getState().applyTranslationFormatting((text) => text.toUpperCase());

            const state = useExcerptsStore.getState();
            expect(state.excerpts[0]?.text).toBe('HELLO');
            expect(state.excerpts[1]?.text).toBe('WORLD');
        });
    });

    describe('applyHeadingFormatting', () => {
        it('should apply formatting to all heading translations', () => {
            useExcerptsStore.setState({ headings: [{ from: 1, id: 'H1', nass: 'عنوان', text: 'chapter one' }] });

            useExcerptsStore.getState().applyHeadingFormatting((text) => text.toUpperCase());

            expect(useExcerptsStore.getState().headings[0]?.text).toBe('CHAPTER ONE');
        });
    });

    describe('applyFootnoteFormatting', () => {
        it('should apply formatting to all footnote translations', () => {
            useExcerptsStore.setState({ footnotes: [{ from: 1, id: 'F1', nass: 'حاشية', text: 'note one' }] });

            useExcerptsStore.getState().applyFootnoteFormatting((text) => text.toUpperCase());

            expect(useExcerptsStore.getState().footnotes[0]?.text).toBe('NOTE ONE');
        });
    });

    describe('filterExcerptsByIds', () => {
        it('should set filtered excerpt IDs', () => {
            useExcerptsStore.getState().filterExcerptsByIds(['E1', 'E2']);

            expect(useExcerptsStore.getState().filteredExcerptIds).toEqual(['E1', 'E2']);
        });

        it('should clear filter when undefined is passed', () => {
            useExcerptsStore.setState({ filteredExcerptIds: ['E1'] });

            useExcerptsStore.getState().filterExcerptsByIds(undefined);

            expect(useExcerptsStore.getState().filteredExcerptIds).toBeUndefined();
        });
    });

    describe('filterHeadingsByIds', () => {
        it('should set filtered heading IDs', () => {
            useExcerptsStore.getState().filterHeadingsByIds(['H1']);

            expect(useExcerptsStore.getState().filteredHeadingIds).toEqual(['H1']);
        });
    });

    describe('filterFootnotesByIds', () => {
        it('should set filtered footnote IDs', () => {
            useExcerptsStore.getState().filterFootnotesByIds(['F1']);

            expect(useExcerptsStore.getState().filteredFootnoteIds).toEqual(['F1']);
        });
    });

    describe('reset', () => {
        it('should reset store to initial state', () => {
            useExcerptsStore.setState({
                collection: 'test',
                excerpts: [{ from: 1, id: 'E1', nass: 'نص', text: 'text' }],
                filteredExcerptIds: ['E1'],
            });

            useExcerptsStore.getState().reset();

            const state = useExcerptsStore.getState();
            expect(state.excerpts).toHaveLength(0);
            expect(state.collection).toBeUndefined();
            expect(state.filteredExcerptIds).toBeUndefined();
        });
    });
});
