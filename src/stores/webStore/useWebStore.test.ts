import { beforeEach, describe, expect, it } from 'bun:test';
import { useWebStore } from './useWebStore';

describe('useWebStore', () => {
    beforeEach(() => {
        useWebStore.getState().reset();
    });

    it('should initialize with default state', () => {
        const state = useWebStore.getState();
        expect(state.pages).toEqual([]);
        expect(state.filteredPageIds).toEqual([]);
        expect(state.contractVersion).toBeDefined();
    });

    it('should init with provided data', () => {
        const data = { pages: [{ content: 'page1', id: 1 } as any], urlPattern: 'https://example.com/{{page}}' };

        useWebStore.getState().init(data as any);

        const state = useWebStore.getState();
        expect(state.pages).toHaveLength(1);
        expect(state.pages[0].content).toBe('page1');
        expect(state.urlPattern).toBe(data.urlPattern);
    });

    it('should filter pages by ids', () => {
        useWebStore.getState().filterPagesByIds([1, 2, 3]);
        expect(useWebStore.getState().filteredPageIds).toEqual([1, 2, 3]);
    });

    it('should filter titles by ids', () => {
        useWebStore.getState().filterTitlesByIds([10, 20]);
        expect(useWebStore.getState().filteredTitleIds).toEqual([10, 20]);
    });

    it('should remove footnotes from all pages', () => {
        const pages = [
            { content: 'p1', id: 1, metadata: { footnotes: 'note1' } },
            { content: 'p2', id: 2, metadata: { footnotes: 'note2' } },
            { content: 'p3', id: 3 }, // no footnotes
        ] as any[];

        useWebStore.getState().init({ pages } as any);

        useWebStore.getState().removeFootnotes();

        const state = useWebStore.getState();
        expect(state.pages[0].metadata?.footnotes).toBeUndefined();
        expect(state.pages[1].metadata?.footnotes).toBeUndefined();
        expect(state.pages[2].metadata?.footnotes).toBeUndefined();
    });

    it('should reset state to initial', () => {
        useWebStore.getState().init({ contractVersion: 'v2.0', pages: [{ content: 'foo', id: 1 } as any] } as any);

        useWebStore.getState().reset();

        const state = useWebStore.getState();
        expect(state.pages).toHaveLength(0);
        expect(state.contractVersion).toBeDefined();
    });
});
