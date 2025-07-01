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
        createdAt: new Date(),
        deletePages: (...args) => set((state) => actions.deletePages(state, ...args)),
        init: (data) => set(() => actions.initStore(data)),
        initFromManuscript: (data) => set(() => actions.initFromManuscript(data)),
        postProcessingApps: [],
        selectedVolume: 0,
        shiftValues: (...args) => set((state) => actions.shiftValues(state, ...args)),
        updatePages: (...args) => set((state) => actions.updatePages(state, ...args)),
        volumeToIndex: {},
        volumeToPages: {},
    })),
);
