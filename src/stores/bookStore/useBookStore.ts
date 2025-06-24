import { create } from 'zustand';

import type { BookState } from './types';

import * as actions from './actions';

/**
 * Creates a Zustand store for managing book state
 * Provides actions for manipulating book data, pages, and selection
 *
 * @returns A Zustand store with book state and actions
 */
export const useBookStore = create<BookState>((set) => {
    return {
        createdAt: new Date(),
        init: (data) => set(() => actions.initStore(data)),
        selectAllPages: (isSelected) => {
            return set((state) => actions.selectAllPages(state, isSelected));
        },
        selectedPages: [],
        selectedVolume: 0,
        setUrlTemplate: (urlTemplate) => {
            return set(() => ({ urlTemplate }));
        },
        urlTemplate: '',
        volumeToPages: {},
    };
});
