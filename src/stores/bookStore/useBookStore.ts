import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
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
