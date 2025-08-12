import { create } from 'zustand';
import { mutative } from 'zustand-mutative';

import type { ManuscriptState } from './types';

import * as actions from './actions';

export const useManuscriptStore = create<ManuscriptState>()(
    mutative((set) => ({
        alignPoetry: (...args) => set((state) => actions.alignPoetry(state, ...args)),
        autoCorrectFootnotes: (pages) => set((state) => actions.autoCorrectFootnotes(state, pages)),
        clearOutPages: (...args) => set((state) => actions.clearOutPages(state, ...args)),
        createdAt: new Date(),
        deleteLines: (ids) => set((state) => actions.deleteLines(state, ids)),
        deleteSupport: (...args) => set((state) => actions.deleteSupport(state, ...args)),
        deleteSupports: (...args) => set((state) => actions.deleteSupports(state, ...args)),
        expandFilteredRow: (...args) => set((state) => actions.expandFilteredRow(state, ...args)),
        filterByIds: (ids) => set(() => ({ idsFilter: new Set(ids) })),
        filterByPages: (pages) => set((state) => actions.filterByPages(state, pages)),
        filterBySimilar: (...args) => set((state) => actions.filterBySimilar(state, ...args)),
        fixTypos: (ids) => set((state) => actions.fixTypos(state, ids)),
        idsFilter: new Set<number>(),
        init: (...args) => set(() => actions.initStore(...args)),
        initFromJuz: (...args) => set(() => actions.initStoreFromJuz(...args)),
        isInitialized: false,
        merge: (...args) => set((state) => actions.merge(state, ...args)),
        mergeWithAbove: (...args) => set((state) => actions.mergeWithAbove(state, ...args)),
        mergeWithBelow: (...args) => set((state) => actions.mergeWithBelow(state, ...args)),
        postProcessingApps: [],
        reset: () => {
            return set(() => ({
                createdAt: new Date(),
                idsFilter: new Set<number>(),
                isInitialized: false,
                postProcessingApps: [],
                savedIds: [],
                sheets: [],
            }));
        },
        savedIds: [],
        saveId: (id) =>
            set((state) => {
                state.savedIds.push(id);
            }),
        searchAndReplace: (...args) => set((state) => actions.searchAndReplace(state, ...args)),
        sheets: [],
        splitAltAtLineBreak: (...args) => set((state) => actions.splitAltAtLineBreak(state, ...args)),
        updatePages: (...args) => set((state) => actions.updatePages(state, ...args)),
        updateTextLines: (...args) => set((state) => actions.updateTextLines(state, ...args)),
    })),
);
