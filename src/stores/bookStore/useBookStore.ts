import { create } from 'zustand';
import { mutative } from 'zustand-mutative';

import type { BookState } from './types';

import * as actions from './actions';

/**
 * Creates a Zustand store for managing book state
 * Provides actions for manipulating book data, pages, and selection
 *
 * @returns A Zustand store with book state and actions
 */

export const useBookStore = create<BookState>()(
    mutative((set) => ({
        addAjza: (...args) => set((state) => actions.addAjza(state, ...args)),
        createdAt: new Date(),
        deletePages: (...args) => set((state) => actions.deletePages(state, ...args)),
        init: (data) => set(() => actions.initStore(data)),
        initFromManuscript: (data) => set(() => actions.initFromManuscript(data)),
        isHighlighterEnabled: false,
        mergeFootnotesWithMatn: (...args) => set((state) => actions.mergeFootnotesWithMatn(state, ...args)),
        postProcessingApps: [],
        reformatPages: (...args) => set((state) => actions.reformatPages(state, ...args)),
        selectedVolume: 0,
        setSelectedVolume: (selectedVolume) => set({ selectedVolume }),
        shiftValues: (...args) => set((state) => actions.shiftValues(state, ...args)),
        toggleHighlighter: () => set((state) => ({ isHighlighterEnabled: !state.isHighlighterEnabled })),
        updatePages: (...args) => set((state) => actions.updatePages(state, ...args)),
        volumeToIndex: {},
        volumeToPages: {},
    })),
);
