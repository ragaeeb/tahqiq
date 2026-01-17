import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { mapBookStateToKitab } from '@/lib/bookFormats';
import { STORAGE_KEYS } from '@/lib/constants';
import { saveToOPFS } from '@/lib/io';
import * as actions from './actions';
import type { BookState } from './types';

/**
 * Creates a Zustand store for managing book state.
 * Uses Immer for immutable updates which provides better DX and performance.
 *
 * @returns A Zustand store with book state and actions
 */
export const useBookStore = create<BookState>()(
    immer((set) => ({
        addAjza: (files) =>
            set((state) => {
                const updates = actions.addAjza(state, files);
                Object.assign(state, updates);
            }),
        createdAt: new Date(),

        deletePages: (pageIds) =>
            set((state) => {
                const updates = actions.deletePages(state, pageIds);
                Object.assign(state, updates);
            }),

        init: (data) =>
            set((state) => {
                const newState = actions.initStore(data);
                // Reset state and apply new state
                state.createdAt = new Date();
                state.postProcessingApps = newState.postProcessingApps || [];
                state.selectedVolume = newState.selectedVolume || 0;
                state.volumeToIndex = newState.volumeToIndex || {};
                state.volumeToPages = newState.volumeToPages || {};
                state.inputFileName = newState.inputFileName;
                if (newState.createdAt) {
                    state.createdAt = newState.createdAt;
                }
            }),

        initFromManuscript: (data) =>
            set((state) => {
                const newState = actions.initFromManuscript(data);
                state.createdAt = newState.createdAt || new Date();
                state.postProcessingApps = newState.postProcessingApps || [];
                state.selectedVolume = newState.selectedVolume || 0;
                state.volumeToIndex = newState.volumeToIndex || {};
                state.volumeToPages = newState.volumeToPages || {};
                state.inputFileName = newState.inputFileName;
            }),
        isHighlighterEnabled: false,

        mergeFootnotesWithMatn: (pageIds) =>
            set((state) => {
                const updates = actions.mergeFootnotesWithMatn(state, pageIds);
                Object.assign(state, updates);
            }),
        postProcessingApps: [],

        reformatPages: (pageIds) =>
            set((state) => {
                const updates = actions.reformatPages(state, pageIds);
                Object.assign(state, updates);
            }),

        reset: () =>
            set((state) => {
                state.createdAt = new Date();
                state.postProcessingApps = [];
                state.selectedVolume = 0;
                state.volumeToIndex = {};
                state.volumeToPages = {};
                state.inputFileName = undefined;
                state.isHighlighterEnabled = false;
            }),

        save: async () => {
            try {
                const state = useBookStore.getState();
                const exportData = mapBookStateToKitab(state);
                await saveToOPFS(STORAGE_KEYS.ketab, exportData);
                return true;
            } catch (err) {
                console.error('Failed to save book to OPFS:', err);
                return false;
            }
        },

        selectedVolume: 0,

        setSelectedVolume: (selectedVolume) =>
            set((state) => {
                state.selectedVolume = selectedVolume;
            }),

        shiftValues: (startingPageId, startingPageValue, key) =>
            set((state) => {
                const updates = actions.shiftValues(state, startingPageId, startingPageValue, key);
                Object.assign(state, updates);
            }),

        toggleHighlighter: () =>
            set((state) => {
                state.isHighlighterEnabled = !state.isHighlighterEnabled;
            }),

        updatePages: (ids, diff, updateLastUpdated = true) =>
            set((state) => {
                const updates = actions.updatePages(state, ids, diff, updateLastUpdated);
                Object.assign(state, updates);
            }),
        volumeToIndex: {},
        volumeToPages: {},
    })),
);
