import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { ShamelaBook } from './types';
import { useShamelaStore } from './useShamelaStore';

const resetStore = () => {
    useShamelaStore.setState({
        filteredPageIds: undefined,
        filteredTitleIds: undefined,
        inputFileName: undefined,
        lastUpdatedAt: undefined,
        majorRelease: 0,
        pages: [],
        shamelaId: undefined,
        titles: [],
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
                majorRelease: 5,
                pages: [{ content: 'Body text', id: 1 }],
                shamelaId: 9999,
                titles: [{ content: 'Intro', id: 1, level: 1, page: 1 }],
            };

            useShamelaStore.getState().init(book, 'book.json');

            const state = useShamelaStore.getState();
            expect(state.majorRelease).toBe(5);
            expect(state.shamelaId).toBe(9999);
            expect(state.inputFileName).toBe('book.json');
            expect(state.pages).toHaveLength(1);
            expect(state.titles).toHaveLength(1);
        });
    });

    describe('updatePage', () => {
        it('should update page properties', () => {
            useShamelaStore.setState({ majorRelease: 1, pages: [{ body: 'Original', id: 1 }], titles: [] });

            useShamelaStore.getState().updatePage(1, { body: 'Updated' });

            expect(useShamelaStore.getState().pages[0]?.body).toBe('Updated');
        });
    });

    describe('updateTitle', () => {
        it('should update title properties', () => {
            useShamelaStore.setState({
                majorRelease: 1,
                pages: [],
                titles: [{ content: 'Old', id: 1, level: 1, page: 1 }],
            });

            useShamelaStore.getState().updateTitle(1, { content: 'New' });

            expect(useShamelaStore.getState().titles[0]?.content).toBe('New');
        });
    });

    describe('deletePage', () => {
        it('should delete page by ID', () => {
            useShamelaStore.setState({
                majorRelease: 1,
                pages: [
                    { body: 'Page 1', id: 1 },
                    { body: 'Page 2', id: 2 },
                ],
                titles: [],
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
                majorRelease: 1,
                pages: [],
                titles: [
                    { content: 'T1', id: 1, level: 1, page: 1 },
                    { content: 'T2', id: 2, level: 1, page: 2 },
                ],
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
            useShamelaStore.setState({ majorRelease: 1, pages: [{ body: 'Some text', id: 1 }], titles: [] });

            useShamelaStore.getState().removePageMarkers();

            expect(useShamelaStore.getState().lastUpdatedAt).toBeInstanceOf(Date);
        });
    });

    describe('removeFootnoteReferences', () => {
        it('should clear footnote from pages', () => {
            useShamelaStore.setState({
                majorRelease: 1,
                pages: [{ body: 'Text', footnote: 'Note', id: 1 }],
                titles: [],
            });

            useShamelaStore.getState().removeFootnoteReferences();

            expect(useShamelaStore.getState().pages[0]?.footnote).toBeUndefined();
        });
    });

    describe('reset', () => {
        it('should reset store pages and titles to initial state', () => {
            useShamelaStore.setState({
                inputFileName: 'file.json',
                majorRelease: 5,
                pages: [{ body: 'Test', id: 1 }],
                shamelaId: 123,
                titles: [{ content: 'Title', id: 1, level: 1, page: 1 }],
            });

            useShamelaStore.getState().reset();

            const state = useShamelaStore.getState();
            expect(state.majorRelease).toBe(0);
            expect(state.pages).toEqual([]);
            expect(state.titles).toEqual([]);
        });
    });
});
