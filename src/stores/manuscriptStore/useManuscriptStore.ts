import { create } from 'zustand';
import { mutative } from 'zustand-mutative';

import type { ManuscriptState } from './types';

import * as actions from './actions';

export const useManuscriptStore = create<ManuscriptState>()(
    mutative((set) => ({
        applySupportToOriginal: (...args) => set((state) => actions.applySupportToOriginal(state, ...args)),
        autoCorrectFootnotes: (pages) => set((state) => actions.autoCorrectFootnotes(state, pages)),
        clearOutPages: (...args) => set((state) => actions.clearOutPages(state, ...args)),
        deleteLines: (ids) => set((state) => actions.deleteLines(state, ids)),
        deleteSupport: (...args) => set((state) => actions.deleteSupport(state, ...args)),
        filterByIds: (ids) => set(() => ({ idsFilter: new Set(ids) })),
        filterByPages: (pages) => set((state) => actions.filterByPages(state, pages)),
        fixTypos: (ids) => set((state) => actions.fixTypos(state, ids)),
        idsFilter: new Set<number>(),
        init: (...args) => set(() => actions.initStore(...args)),
        initFromJuz: (...args) => set(() => actions.initStoreFromJuz(...args)),
        isInitialized: false,
        mergeWithAbove: (...args) => set((state) => actions.mergeWithAbove(state, ...args)),
        mergeWithBelow: (...args) => set((state) => actions.mergeWithBelow(state, ...args)),
        replaceHonorifics: (...args) => set((state) => actions.replaceHonorifics(state, ...args)),
        sheets: [],
        splitAltAtLineBreak: (...args) => set((state) => actions.splitAltAtLineBreak(state, ...args)),
        updateTextLines: (...args) => set((state) => actions.updateTextLines(state, ...args)),
    })),
);
