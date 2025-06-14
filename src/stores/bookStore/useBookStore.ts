import { create } from 'zustand';

import type { BookState } from './types';

import { selectAllPages } from './actions';

/**
 * Creates a Zustand store for managing manuscript state
 * Provides actions for manipulating manuscript data, pages, and selection
 *
 * @returns A Zustand store with manuscript state and actions
 */
export const useBookStore = create<BookState>((set) => {
    return {
        createdAt: new Date(),
        selectAllPages: (isSelected) => {
            return set((state) => selectAllPages(state, isSelected));
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
