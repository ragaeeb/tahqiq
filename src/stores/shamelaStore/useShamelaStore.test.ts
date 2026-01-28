import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { ShamelaBook } from './types';
import { useShamelaStore } from './useShamelaStore';

const resetStore = () => {
    useShamelaStore.setState({
        filteredPageIds: undefined,
        filteredTitleIds: undefined,
        inputFileName: undefined,
        lastUpdatedAt: undefined,
        pages: [],
        shamelaId: undefined,
        titles: [],
        version: '0',
    });
};

describe('useShamelaStore', () => {
    beforeEach(() => {
        resetStore();
    });

    afterEach(() => {
        resetStore();
    });

    describe('init', () => {
        it('should initialize store with book data', () => {
            const book: ShamelaBook = {
                id: 9999,
                pages: [{ content: 'Body text', id: 1 }],
                titles: [{ content: 'Intro', id: 1, page: 1 }],
                version: '5',
            };

            useShamelaStore.getState().init(book, 'book.json');

            const state = useShamelaStore.getState();
            expect(state.version).toBe('5');
            expect(state.shamelaId).toBe(9999);
            expect(state.inputFileName).toBe('book.json');
            expect(state.pages).toHaveLength(1);
            expect(state.titles).toHaveLength(1);
        });
    });

    describe('updatePage', () => {
        it('should update page properties', () => {
            useShamelaStore.setState({ pages: [{ body: 'Original', id: 1 }], titles: [], version: '1' });

            useShamelaStore.getState().updatePage(1, { body: 'Updated' });

            expect(useShamelaStore.getState().pages[0]?.body).toBe('Updated');
        });
    });

    describe('updateTitle', () => {
        it('should update title properties', () => {
            useShamelaStore.setState({ pages: [], titles: [{ content: 'Old', id: 1, page: 1 }], version: '1' });

            useShamelaStore.getState().updateTitle(1, { content: 'New' });

            expect(useShamelaStore.getState().titles[0]?.content).toBe('New');
        });
    });

    describe('deletePage', () => {
        it('should delete page by ID', () => {
            useShamelaStore.setState({
                pages: [
                    { body: 'Page 1', id: 1 },
                    { body: 'Page 2', id: 2 },
                ],
                titles: [],
                version: '1',
            });

            useShamelaStore.getState().deletePage(1);

            const pages = useShamelaStore.getState().pages;
            expect(pages).toHaveLength(1);
            expect(pages[0]?.id).toBe(2);
        });
    });

    describe('deleteTitle', () => {
        it('should delete title by ID', () => {
            useShamelaStore.setState({
                pages: [],
                titles: [
                    { content: 'T1', id: 1, page: 1 },
                    { content: 'T2', id: 2, page: 2 },
                ],
                version: '1',
            });

            useShamelaStore.getState().deleteTitle(1);

            expect(useShamelaStore.getState().titles).toHaveLength(1);
            expect(useShamelaStore.getState().titles[0]?.id).toBe(2);
        });
    });

    describe('filterPagesByIds', () => {
        it('should set filtered page IDs', () => {
            useShamelaStore.getState().filterPagesByIds([1, 2, 3]);

            expect(useShamelaStore.getState().filteredPageIds).toEqual([1, 2, 3]);
        });

        it('should clear filter when undefined passed', () => {
            useShamelaStore.setState({ filteredPageIds: [1] });

            useShamelaStore.getState().filterPagesByIds(undefined);

            expect(useShamelaStore.getState().filteredPageIds).toBeUndefined();
        });
    });

    describe('filterTitlesByIds', () => {
        it('should set filtered title IDs', () => {
            useShamelaStore.getState().filterTitlesByIds([10, 20]);

            expect(useShamelaStore.getState().filteredTitleIds).toEqual([10, 20]);
        });
    });

    describe('removePageMarkers', () => {
        it('should set lastUpdatedAt after processing', () => {
            useShamelaStore.setState({ pages: [{ body: 'Some text', id: 1 }], titles: [], version: '1' });

            useShamelaStore.getState().removePageMarkers();

            expect(useShamelaStore.getState().lastUpdatedAt).toBeInstanceOf(Date);
        });
    });

    describe('removeFootnoteReferences', () => {
        it('should clear footnote from pages', () => {
            useShamelaStore.setState({ pages: [{ body: 'Text', footnote: 'Note', id: 1 }], titles: [], version: '1' });

            useShamelaStore.getState().removeFootnoteReferences();

            expect(useShamelaStore.getState().pages[0]?.footnote).toBeUndefined();
        });
    });

    describe('reset', () => {
        it('should reset store pages and titles to initial state', () => {
            useShamelaStore.setState({
                inputFileName: 'file.json',
                pages: [{ body: 'Test', id: 1 }],
                shamelaId: 123,
                titles: [{ content: 'Title', id: 1, page: 1 }],
                version: '5',
            });

            useShamelaStore.getState().reset();

            const state = useShamelaStore.getState();
            expect(state.version).toBe('0');
            expect(state.pages).toEqual([]);
            expect(state.titles).toEqual([]);
        });
    });
});
