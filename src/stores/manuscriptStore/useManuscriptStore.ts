import { create } from 'zustand';
import { mutative } from 'zustand-mutative';

import type { ManuscriptState } from './types';

import * as actions from './actions';

export const useManuscriptStore = create<ManuscriptState>()(
    mutative((set) => ({
        applySupportToOriginal: (page, id) => set((state) => actions.applySupportToOriginal(state, page, id)),
        autoCorrectFootnotes: (pages) => set((state) => actions.autoCorrectFootnotes(state, pages)),
        deleteLines: (ids) => set((state) => actions.deleteLines(state, ids)),
        deleteSupport: (page, id) => set((state) => actions.deleteSupport(state, page, id)),
        filterByIds: (ids) => set(() => ({ idsFilter: new Set(ids) })),
        filterByPages: (pages) => set((state) => actions.filterByPages(state, pages)),
        fixTypos: (ids) => set((state) => actions.fixTypos(state, ids)),
        idsFilter: new Set<number>(),
        init: (data) => set(() => actions.initStore(data)),
        mergeWithAbove: (page, id) => set((state) => actions.mergeWithAbove(state, page, id)),
        replaceHonorifics: (ids, from, to) => set((state) => actions.replaceHonorifics(state, ids, from, to)),
        setPoetry: (pageToPoeticIds) => set((state) => actions.setPoetry(state, pageToPoeticIds)),
        sheets: [],
        splitAltAtLineBreak: (page, id, alt) => set((state) => actions.splitAltAtLineBreak(state, page, id, alt)),
        toggleFootnotes: (ids) => set((state) => actions.toggleFootnotes(state, ids)),
        updateText: (page, id, text) => set((state) => actions.updateText(state, page, id, text)),
    })),
);
