import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { useBookStore } from './useBookStore';

const resetStore = () => {
    useBookStore.setState({
        createdAt: new Date(),
        inputFileName: undefined,
        isHighlighterEnabled: false,
        postProcessingApps: [],
        selectedVolume: 0,
        volumeToIndex: {},
        volumeToPages: {},
    });
};

describe('useBookStore', () => {
    beforeEach(() => {
        resetStore();
    });

    afterEach(() => {
        resetStore();
    });

    describe('setSelectedVolume', () => {
        it('should update selected volume', () => {
            useBookStore.getState().setSelectedVolume(5);

            expect(useBookStore.getState().selectedVolume).toBe(5);
        });
    });

    describe('toggleHighlighter', () => {
        it('should toggle highlighter state', () => {
            expect(useBookStore.getState().isHighlighterEnabled).toBe(false);

            useBookStore.getState().toggleHighlighter();

            expect(useBookStore.getState().isHighlighterEnabled).toBe(true);

            useBookStore.getState().toggleHighlighter();

            expect(useBookStore.getState().isHighlighterEnabled).toBe(false);
        });
    });

    describe('updatePages', () => {
        it('should update pages through store action', () => {
            useBookStore.setState({
                selectedVolume: 1,
                volumeToPages: {
                    1: [{ id: 1, lastUpdate: 1000, page: 1, text: 'Original', volume: 1, volumePage: 1 }],
                },
            });

            useBookStore.getState().updatePages([1], { text: 'Updated' });

            expect(useBookStore.getState().volumeToPages[1]?.[0]?.text).toBe('Updated');
        });
    });

    describe('deletePages', () => {
        it('should delete pages by IDs', () => {
            useBookStore.setState({
                selectedVolume: 1,
                volumeToPages: {
                    1: [
                        { id: 1, lastUpdate: 1000, page: 1, text: 'P1', volume: 1, volumePage: 1 },
                        { id: 2, lastUpdate: 1000, page: 2, text: 'P2', volume: 1, volumePage: 2 },
                    ],
                },
            });

            useBookStore.getState().deletePages([1]);

            const pages = useBookStore.getState().volumeToPages[1];
            expect(pages).toHaveLength(1);
            expect(pages?.[0]?.id).toBe(2);
        });
    });

    describe('shiftValues', () => {
        it('should shift page values', () => {
            useBookStore.setState({
                selectedVolume: 1,
                volumeToPages: {
                    1: [
                        { id: 1, lastUpdate: 1000, page: 1, text: 'P1', volume: 1, volumePage: 1 },
                        { id: 2, lastUpdate: 1000, page: 2, text: 'P2', volume: 1, volumePage: 2 },
                    ],
                },
            });

            useBookStore.getState().shiftValues(1, 10, 'page');

            const pages = useBookStore.getState().volumeToPages[1];
            expect(pages?.[0]?.page).toBe(10);
            expect(pages?.[1]?.page).toBe(11);
        });
    });

    describe('mergeFootnotesWithMatn', () => {
        it('should merge footnotes with page text', () => {
            useBookStore.setState({
                selectedVolume: 1,
                volumeToPages: {
                    1: [
                        { footnotes: 'Note', id: 1, lastUpdate: 1000, page: 1, text: 'Main', volume: 1, volumePage: 1 },
                    ],
                },
            });

            useBookStore.getState().mergeFootnotesWithMatn([1]);

            const page = useBookStore.getState().volumeToPages[1]?.[0];
            expect(page?.text).toBe('Main\nNote');
            expect(page?.footnotes).toBeUndefined();
        });
    });

    describe('reset', () => {
        it('should reset store to initial state', () => {
            useBookStore.setState({
                inputFileName: 'test.json',
                isHighlighterEnabled: true,
                postProcessingApps: ['app'],
                selectedVolume: 5,
                volumeToPages: { 5: [] },
            });

            useBookStore.getState().reset();

            const state = useBookStore.getState();
            expect(state.selectedVolume).toBe(0);
            expect(state.volumeToPages).toEqual({});
            expect(state.inputFileName).toBeUndefined();
            expect(state.isHighlighterEnabled).toBe(false);
        });
    });
});
