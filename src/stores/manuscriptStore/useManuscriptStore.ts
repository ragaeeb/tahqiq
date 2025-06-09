import { create } from 'zustand';

import type { ManuscriptState } from './types';

import { initStore, selectAllPages } from './actions';

/**
 * Creates a Zustand store for managing manuscript state
 * Provides actions for manipulating manuscript data, pages, and selection
 *
 * @returns A Zustand store with manuscript state and actions
 */
export const useManuscriptStore = create<ManuscriptState>((set) => {
    return {
        createdAt: new Date(),
        init: (data) => set(() => initStore(data)),
        selectAllPages: (isSelected: boolean) => {
            return set((state) => selectAllPages(state, isSelected));
        },
        selectedPages: [],
        selectedVolume: 0,
        setUrlTemplate: (urlTemplate: string) => {
            return set(() => ({ urlTemplate }));
        },
        urlTemplate: '',
        volumeToPages: {},
    };
});
