import { create } from 'zustand';

import type { ManuscriptState } from './types';

import {
    applySupportToOriginal,
    autoCorrectFootnotes,
    fixTypos,
    initStore,
    mergeObservationsToParagraphs,
    mergeWithAbove,
    setPoetry,
    splitAltAtLineBreak,
} from './actions';

/**
 * Creates a Zustand store for managing manuscript state
 * Provides actions for manipulating manuscript data, pages, and selection
 *
 * @returns A Zustand store with manuscript state and actions
 */
export const useManuscriptStore = create<ManuscriptState>((set) => {
    return {
        applySupportToOriginal: (page, id) => set((state) => applySupportToOriginal(state, page, id)),
        autoCorrectFootnotes: (pages) => set((state) => autoCorrectFootnotes(state, pages)),
        fixTypos: (ids) => set((state) => fixTypos(state, ids)),
        init: (data) => set(() => initStore(data)),
        mergePageObservationsToParagraphs: (page) => set((state) => mergeObservationsToParagraphs(state, page)),
        mergeWithAbove: (page, id) => set((state) => mergeWithAbove(state, page, id)),
        setPoetry: (pageToPoeticIds) => set((state) => setPoetry(state, pageToPoeticIds)),
        sheets: [],
        splitAltAtLineBreak: (page, id, alt) => set((state) => splitAltAtLineBreak(state, page, id, alt)),
    };
});
