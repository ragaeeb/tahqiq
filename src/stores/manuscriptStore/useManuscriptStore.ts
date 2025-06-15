import { create } from 'zustand';

import type { ManuscriptState } from './types';

import { initStore, mergeWithAbove, splitAltAtLineBreak } from './actions';

/**
 * Creates a Zustand store for managing manuscript state
 * Provides actions for manipulating manuscript data, pages, and selection
 *
 * @returns A Zustand store with manuscript state and actions
 */
export const useManuscriptStore = create<ManuscriptState>((set) => {
    return {
        init: (data) => set(() => initStore(data)),
        mergeWithAbove: (page, index) => set((state) => mergeWithAbove(state, page, index)),
        sheets: [],
        splitAltAtLineBreak: (page, index, alt) => set((state) => splitAltAtLineBreak(state, page, index, alt)),
    };
});
