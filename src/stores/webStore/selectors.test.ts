import { describe, expect, it } from 'bun:test';
import { selectAllPages, selectAllTitles } from './selectors';
import type { WebState } from './types';

const INITIAL_STATE: WebState = {
    contractVersion: 'v1.0',
    createdAt: 0,
    filteredPageIds: [],
    filteredTitleIds: [],
    filterPagesByIds: () => {},
    filterTitlesByIds: () => {},
    init: () => {},
    lastUpdatedAt: 0,
    pages: [],
    postProcessingApps: [],
    removeFootnotes: () => {},
    reset: () => {},
    type: 'web',
    urlPattern: '',
};

describe('WebStore Selectors', () => {
    describe('selectAllPages', () => {
        it('should return all pages if no filter applied', () => {
            const state: WebState = {
                ...INITIAL_STATE,
                pages: [
                    { content: 'p1', id: 1 },
                    { content: 'p2', id: 2 },
                ] as any,
            };

            const result = selectAllPages(state);
            expect(result).toHaveLength(2);
            expect(result.map((p) => p.id)).toEqual([1, 2]);
        });

        it('should return only filtered pages', () => {
            const state: WebState = {
                ...INITIAL_STATE,
                filteredPageIds: [2],
                pages: [
                    { content: 'p1', id: 1 },
                    { content: 'p2', id: 2 },
                ] as any,
            };

            const result = selectAllPages(state);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(2);
        });

        it('should filter out pages without content', () => {
            const state: WebState = {
                ...INITIAL_STATE,
                pages: [
                    { content: 'p1', id: 1 },
                    { id: 2 }, // No content
                ] as any,
            };

            const result = selectAllPages(state);
            expect(result).toHaveLength(1);
            expect(result[0].content).toBe('p1');
        });
    });

    describe('selectAllTitles', () => {
        it('should return all titles if no filter applied', () => {
            const state: WebState = {
                ...INITIAL_STATE,
                pages: [
                    { id: 1, title: 't1' },
                    { id: 2, title: 't2' },
                    { id: 3 }, // No title
                ] as any,
            };

            const result = selectAllTitles(state);
            expect(result).toHaveLength(2);
            expect(result).toEqual([
                { content: 't1', id: 1 },
                { content: 't2', id: 2 },
            ]);
        });

        it('should return only filtered titles', () => {
            const state: WebState = {
                ...INITIAL_STATE,
                filteredTitleIds: [2],
                pages: [
                    { id: 1, title: 't1' },
                    { id: 2, title: 't2' },
                ] as any,
            };

            const result = selectAllTitles(state);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(2);
        });
    });
});
