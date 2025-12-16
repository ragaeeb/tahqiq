import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import * as actions from './actions';
import type { ShamelaState } from './types';

/**
 * Creates a Zustand store for managing Shamela book state.
 * Uses Immer for immutable updates.
 */
export const useShamelaStore = create<ShamelaState>()(
    immer((set) => ({
        // Spread initial state values
        ...actions.INITIAL_STATE,

        deletePage: (id) =>
            set((state) => {
                actions.deletePage(state, id);
            }),

        deleteTitle: (id) =>
            set((state) => {
                actions.deleteTitle(state, id);
            }),

        filterPagesByIds: (ids) =>
            set((state) => {
                actions.filterPagesByIds(state, ids);
            }),

        filterTitlesByIds: (ids) =>
            set((state) => {
                actions.filterTitlesByIds(state, ids);
            }),

        init: (data, fileName) =>
            set((state) => {
                const newState = actions.initStore(data, fileName);
                Object.assign(state, newState);
            }),

        removeFootnoteReferences: () =>
            set((state) => {
                actions.removeFootnoteReferences(state);
            }),

        removePageMarkers: () =>
            set((state) => {
                actions.removePageMarkers(state);
            }),

        reset: () =>
            set((state) => {
                const newState = actions.resetStore();
                Object.assign(state, newState);
            }),

        updatePage: (id, updates) =>
            set((state) => {
                actions.updatePage(state, id, updates);
            }),

        updateTitle: (id, updates) =>
            set((state) => {
                actions.updateTitle(state, id, updates);
            }),
    })),
);
