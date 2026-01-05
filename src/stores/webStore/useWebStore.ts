import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import * as actions from './actions';
import type { WebState } from './types';

/**
 * Creates a Zustand store for managing Web book state.
 * Uses Immer for immutable updates.
 */
export const useWebStore = create<WebState>()(
    immer((set) => ({
        // Spread initial state values
        ...actions.INITIAL_STATE,

        applyBodyFormatting: (formatFn) =>
            set((state) => {
                actions.applyBodyFormatting(state, formatFn);
            }),

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

        removeFootnotes: () =>
            set((state) => {
                actions.removeFootnotes(state);
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
