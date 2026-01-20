import { describe, expect, it } from 'bun:test';
import {
    deletePage,
    deleteTitle,
    filterPagesByIds,
    filterTitlesByIds,
    INITIAL_STATE,
    initStore,
    removeFootnotes,
    resetStore,
    updatePage,
    updateTitle,
} from './actions';
import type { WebBook, WebStateCore } from './types';

describe('webStore/actions', () => {
    describe('initStore', () => {
        it('should initialize store from web book data', () => {
            const book: WebBook = {
                pages: [
                    { body: 'First page body', page: 1, title: 'First Title' },
                    { body: 'Second page body', page: 2, title: 'Second Title' },
                ],
                scrapingEngine: { name: 'jami-scrapi', version: '2.1.0' },
                timestamp: '2025-02-25T03:48:03.030Z',
                urlPattern: 'https://example.com/page?id={{page}}',
            };

            const result = initStore(book, 'test-web.json');

            expect(result.inputFileName).toBe('test-web.json');
            expect(result.urlPattern).toBe('https://example.com/page?id={{page}}');
            expect(result.scrapingEngine?.name).toBe('jami-scrapi');
            expect(result.pages).toHaveLength(2);
            expect(result.pages[0]?.id).toBe(1);
            expect(result.pages[0]?.body).toBe('First page body');
            expect(result.pages[0]?.title).toBe('First Title');
            expect(result.pages[1]?.id).toBe(2);
            expect(result.titles).toHaveLength(2);
            expect(result.titles[0]?.id).toBe(1);
            expect(result.titles[0]?.content).toBe('First Title');
            expect(result.titles[0]?.page).toBe(1);
        });

        it('should handle pages without titles', () => {
            const book: WebBook = {
                pages: [
                    { body: 'Page without title', page: 1 },
                    { body: 'Page with title', page: 2, title: 'Has Title' },
                ],
            };

            const result = initStore(book);

            expect(result.pages).toHaveLength(2);
            expect(result.titles).toHaveLength(1);
            expect(result.titles[0]?.content).toBe('Has Title');
            expect(result.titles[0]?.page).toBe(2);
        });

        it('should handle pages with footnotes', () => {
            const book: WebBook = { pages: [{ body: 'Body content', footnote: 'Footnote content', page: 1 }] };

            const result = initStore(book);

            expect(result.pages[0]?.body).toBe('Body content');
            expect(result.pages[0]?.footnote).toBe('Footnote content');
        });

        it('should preserve optional page fields', () => {
            const book: WebBook = {
                pages: [
                    {
                        accessed: '2025-02-25T03:36:06.210Z',
                        body: 'Content',
                        page: 1,
                        url: 'https://example.com/fatwa/1',
                    },
                ],
            };

            const result = initStore(book);

            expect(result.pages[0]?.accessed).toBe('2025-02-25T03:36:06.210Z');
            expect(result.pages[0]?.url).toBe('https://example.com/fatwa/1');
        });
    });

    describe('resetStore', () => {
        it('should return initial state', () => {
            const result = resetStore();

            expect(result).toEqual(INITIAL_STATE);
            expect(result.pages).toEqual([]);
            expect(result.titles).toEqual([]);
        });
    });

    describe('updatePage', () => {
        it('should update page body and set lastUpdatedAt', () => {
            const state: WebStateCore = { pages: [{ body: 'Old body', id: 1 }], titles: [] };

            updatePage(state, 1, { body: 'New body' });

            expect(state.pages[0]?.body).toBe('New body');
            expect(state.pages[0]?.lastUpdatedAt).toBeDefined();
            expect(state.lastUpdatedAt).toBeInstanceOf(Date);
        });

        it('should not update if page ID not found', () => {
            const state: WebStateCore = { pages: [{ body: 'Body', id: 1 }], titles: [] };

            updatePage(state, 999, { body: 'New body' });

            expect(state.pages[0]?.body).toBe('Body');
            expect(state.lastUpdatedAt).toBeUndefined();
        });

        it('should update footnote', () => {
            const state: WebStateCore = { pages: [{ body: 'Body', footnote: 'Old footnote', id: 1 }], titles: [] };

            updatePage(state, 1, { footnote: 'New footnote' });

            expect(state.pages[0]?.footnote).toBe('New footnote');
        });
    });

    describe('updateTitle', () => {
        it('should update title content and set lastUpdatedAt', () => {
            const state: WebStateCore = { pages: [], titles: [{ content: 'Old title', id: 1, page: 1 }] };

            updateTitle(state, 1, { content: 'New title' });

            expect(state.titles[0]?.content).toBe('New title');
            expect(state.titles[0]?.lastUpdatedAt).toBeDefined();
            expect(state.lastUpdatedAt).toBeInstanceOf(Date);
        });

        it('should not update if title ID not found', () => {
            const state: WebStateCore = { pages: [], titles: [{ content: 'Title', id: 1, page: 1 }] };

            updateTitle(state, 999, { content: 'New' });

            expect(state.titles[0]?.content).toBe('Title');
        });
    });

    describe('deletePage', () => {
        it('should remove page by ID', () => {
            const state: WebStateCore = {
                pages: [
                    { body: 'Page 1', id: 1 },
                    { body: 'Page 2', id: 2 },
                ],
                titles: [],
            };

            deletePage(state, 1);

            expect(state.pages).toHaveLength(1);
            expect(state.pages[0]?.id).toBe(2);
            expect(state.lastUpdatedAt).toBeInstanceOf(Date);
        });
    });

    describe('deleteTitle', () => {
        it('should remove title by ID', () => {
            const state: WebStateCore = {
                pages: [],
                titles: [
                    { content: 'Title 1', id: 1, page: 1 },
                    { content: 'Title 2', id: 2, page: 2 },
                ],
            };

            deleteTitle(state, 2);

            expect(state.titles).toHaveLength(1);
            expect(state.titles[0]?.id).toBe(1);
        });
    });

    describe('filterPagesByIds', () => {
        it('should set filteredPageIds', () => {
            const state: WebStateCore = { pages: [], titles: [] };

            filterPagesByIds(state, [1, 2, 3]);

            expect(state.filteredPageIds).toEqual([1, 2, 3]);
        });

        it('should clear filter when undefined is passed', () => {
            const state: WebStateCore = { filteredPageIds: [1, 2], pages: [], titles: [] };

            filterPagesByIds(state, undefined);

            expect(state.filteredPageIds).toBeUndefined();
        });
    });

    describe('filterTitlesByIds', () => {
        it('should set filteredTitleIds', () => {
            const state: WebStateCore = { pages: [], titles: [] };

            filterTitlesByIds(state, [10, 20]);

            expect(state.filteredTitleIds).toEqual([10, 20]);
        });
    });

    describe('removeFootnotes', () => {
        it('should clear footnote content from pages', () => {
            const state: WebStateCore = {
                pages: [
                    { body: 'Text', footnote: 'Footnote content', id: 1 },
                    { body: 'More text', footnote: 'Another footnote', id: 2 },
                ],
                titles: [],
            };

            removeFootnotes(state);

            expect(state.pages[0]?.footnote).toBeUndefined();
            expect(state.pages[1]?.footnote).toBeUndefined();
            expect(state.pages[0]?.lastUpdatedAt).toBeDefined();
            expect(state.lastUpdatedAt).toBeInstanceOf(Date);
        });

        it('should not modify pages without footnotes', () => {
            const state: WebStateCore = { pages: [{ body: 'Text without footnote', id: 1 }], titles: [] };

            removeFootnotes(state);

            expect(state.pages[0]?.footnote).toBeUndefined();
            expect(state.pages[0]?.lastUpdatedAt).toBeUndefined();
        });
    });
});
