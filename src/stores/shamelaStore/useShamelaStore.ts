import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { STORAGE_KEYS } from '@/lib/constants';
import { saveToOPFS } from '@/lib/io';
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

        save: async () => {
            try {
                const state = useShamelaStore.getState();
                const exportData = {
                    pages: state.pages.map((p) => ({
                        content: p.footnote ? `${p.body}_________${p.footnote}` : p.body,
                        id: p.id,
                        number: p.number,
                        page: p.page,
                        part: p.part,
                    })),
                    shamelaId: state.shamelaId,
                    titles: state.titles.map((t) => ({ content: t.content, id: t.id, page: t.page, parent: t.parent })),
                    version: state.version,
                };
                await saveToOPFS(STORAGE_KEYS.shamela, exportData);
                return true;
            } catch (err) {
                console.error('Failed to save shamela to OPFS:', err);
                return false;
            }
        },

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
