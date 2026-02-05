import { describe, expect, it } from 'bun:test';
import {
    deletePage,
    deleteTitle,
    filterPagesByIds,
    filterTitlesByIds,
    INITIAL_STATE,
    initStore,
    removeFootnoteReferences,
    removePageMarkers,
    resetStore,
    updatePage,
    updateTitle,
} from './actions';
import type { ShamelaBook, ShamelaStateCore } from './types';

describe('shamelaStore/actions', () => {
    describe('initStore', () => {
        it('should initialize store from Shamela book data', () => {
            const book: ShamelaBook = {
                bibliography: 'Test bibliography',
                id: 12345,
                name: 'Test Book',
                pages: [
                    { content: 'Page body', id: 1 },
                    { content: 'Second page', id: 2 },
                ],
                titles: [{ content: 'Chapter 1', id: 1, page: 1 }],
                version: '2',
            } as any;

            const result = initStore(book, 'test-book.json');

            expect(result.version).toBe('2');
            expect(result.shamelaId).toBe(12345);
            expect(result.inputFileName).toBe('test-book.json');
            expect(result.pages).toHaveLength(2);
            expect(result.pages[0]?.id).toBe(1);
            expect(result.pages[1]?.id).toBe(2);
            expect(result.titles).toHaveLength(1);
        });

        it('should handle pages with footnote separator', () => {
            const book: ShamelaBook = {
                bibliography: 'Bibliyo',
                id: 1,
                name: 'BookName',
                pages: [{ content: 'Body\n___\nFootnote', id: 1 }],
                titles: [],
                version: '1',
            } as any;

            const result = initStore(book);

            // The splitPageBodyFromFooter function handles separation
            expect(result.pages[0]?.body).toBeDefined();
            expect(result.pages).toHaveLength(1);
        });
    });

    describe('resetStore', () => {
        it('should return initial state', () => {
            const result = resetStore();

            expect(result).toEqual(INITIAL_STATE);
            expect(result.version).toBe('0');
            expect(result.pages).toEqual([]);
            expect(result.titles).toEqual([]);
        });
    });

    describe('updatePage', () => {
        it('should update page body and set lastUpdatedAt', () => {
            const state: ShamelaStateCore = { pages: [{ body: 'Old body', id: 1 }], titles: [], version: '1' };

            updatePage(state, 1, { body: 'New body' });

            expect(state.pages[0]?.body).toBe('New body');
            expect(state.pages[0]?.lastUpdatedAt).toBeDefined();
            expect(state.lastUpdatedAt).toBeInstanceOf(Date);
        });

        it('should not update if page ID not found', () => {
            const state: ShamelaStateCore = { pages: [{ body: 'Body', id: 1 }], titles: [], version: '1' };

            updatePage(state, 999, { body: 'New body' });

            expect(state.pages[0]?.body).toBe('Body');
            expect(state.lastUpdatedAt).toBeUndefined();
        });
    });

    describe('updateTitle', () => {
        it('should update title content and set lastUpdatedAt', () => {
            const state: ShamelaStateCore = {
                pages: [],
                titles: [{ content: 'Old title', id: 1, page: 1 }],
                version: '1',
            };

            updateTitle(state, 1, { content: 'New title' });

            expect(state.titles[0]?.content).toBe('New title');
            expect(state.titles[0]?.lastUpdatedAt).toBeDefined();
            expect(state.lastUpdatedAt).toBeInstanceOf(Date);
        });

        it('should not update if title ID not found', () => {
            const state: ShamelaStateCore = { pages: [], titles: [{ content: 'Title', id: 1, page: 1 }], version: '1' };

            updateTitle(state, 999, { content: 'New' });

            expect(state.titles[0]?.content).toBe('Title');
        });
    });

    describe('deletePage', () => {
        it('should remove page by ID', () => {
            const state: ShamelaStateCore = {
                pages: [
                    { body: 'Page 1', id: 1 },
                    { body: 'Page 2', id: 2 },
                ],
                titles: [],
                version: '1',
            };

            deletePage(state, 1);

            expect(state.pages).toHaveLength(1);
            expect(state.pages[0]?.id).toBe(2);
            expect(state.lastUpdatedAt).toBeInstanceOf(Date);
        });
    });

    describe('deleteTitle', () => {
        it('should remove title by ID', () => {
            const state: ShamelaStateCore = {
                pages: [],
                titles: [
                    { content: 'Title 1', id: 1, page: 1 },
                    { content: 'Title 2', id: 2, page: 2 },
                ],
                version: '1',
            };

            deleteTitle(state, 2);

            expect(state.titles).toHaveLength(1);
            expect(state.titles[0]?.id).toBe(1);
        });
    });

    describe('filterPagesByIds', () => {
        it('should set filteredPageIds', () => {
            const state: ShamelaStateCore = { pages: [], titles: [], version: '1' };

            filterPagesByIds(state, [1, 2, 3]);

            expect(state.filteredPageIds).toEqual([1, 2, 3]);
        });

        it('should clear filter when undefined is passed', () => {
            const state: ShamelaStateCore = { filteredPageIds: [1, 2], pages: [], titles: [], version: '1' };

            filterPagesByIds(state, undefined);

            expect(state.filteredPageIds).toBeUndefined();
        });
    });

    describe('filterTitlesByIds', () => {
        it('should set filteredTitleIds', () => {
            const state: ShamelaStateCore = { pages: [], titles: [], version: '1' };

            filterTitlesByIds(state, [10, 20]);

            expect(state.filteredTitleIds).toEqual([10, 20]);
        });
    });

    describe('removePageMarkers', () => {
        it('should set lastUpdatedAt after processing pages', () => {
            const state: ShamelaStateCore = { pages: [{ body: 'Some text', id: 1 }], titles: [], version: '1' };

            removePageMarkers(state);

            expect(state.lastUpdatedAt).toBeInstanceOf(Date);
        });
    });

    describe('removeFootnoteReferences', () => {
        it('should clear footnote content from pages', () => {
            const state: ShamelaStateCore = {
                pages: [{ body: 'Text with ref', footnote: 'Footnote content', id: 1 }],
                titles: [],
                version: '1',
            };

            removeFootnoteReferences(state);

            expect(state.pages[0]?.footnote).toBeUndefined();
            expect(state.pages[0]?.lastUpdatedAt).toBeDefined();
        });
    });
});
