import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { STORAGE_KEYS } from '@/lib/constants';
import { saveToOPFS } from '@/lib/io';
import { mapManuscriptToJuz } from '@/lib/manuscript';
import * as actions from './actions';
import type { ManuscriptState } from './types';

export const useManuscriptStore = create<ManuscriptState>()(
    immer((set) => ({
        alignPoetry: (...args) =>
            set((state) => {
                actions.alignPoetry(state, ...args);
            }),
        autoCorrectFootnotes: (pages) =>
            set((state) => {
                actions.autoCorrectFootnotes(state, pages);
            }),
        clearOutPages: (...args) =>
            set((state) => {
                actions.clearOutPages(state, ...args);
            }),
        createdAt: new Date(),
        deleteLines: (ids) =>
            set((state) => {
                actions.deleteLines(state, ids);
            }),
        deleteSupport: (...args) =>
            set((state) => {
                actions.deleteSupport(state, ...args);
            }),
        deleteSupports: (...args) =>
            set((state) => {
                actions.deleteSupports(state, ...args);
            }),
        expandFilteredRow: (...args) =>
            set((state) => {
                actions.expandFilteredRow(state, ...args);
            }),
        filterByIds: (ids) =>
            set((state) => {
                state.idsFilter = new Set(ids);
            }),
        filterByPages: (pages) =>
            set((state) => {
                const result = actions.filterByPages(state, pages);
                Object.assign(state, result);
            }),
        filterBySimilar: (...args) =>
            set((state) => {
                const result = actions.filterBySimilar(state, ...args);
                Object.assign(state, result);
            }),
        fixTypos: (ids) =>
            set((state) => {
                actions.fixTypos(state, ids);
            }),
        idsFilter: new Set<number>(),
        init: (...args) =>
            set((state) => {
                const result = actions.initStore(...args);
                Object.assign(state, result);
            }),
        initFromJuz: (...args) =>
            set((state) => {
                const result = actions.initStoreFromJuz(...args);
                Object.assign(state, result);
            }),
        isInitialized: false,
        merge: (...args) =>
            set((state) => {
                actions.merge(state, ...args);
            }),
        mergeWithAbove: (...args) =>
            set((state) => {
                actions.mergeWithAbove(state, ...args);
            }),
        mergeWithBelow: (...args) =>
            set((state) => {
                actions.mergeWithBelow(state, ...args);
            }),
        postProcessingApps: [],
        reset: () =>
            set((state) => {
                state.createdAt = new Date();
                state.idsFilter = new Set<number>();
                state.isInitialized = false;
                state.postProcessingApps = [];
                state.savedIds = [];
                state.sheets = [];
                state.url = '';
            }),
        save: async () => {
            try {
                const state = useManuscriptStore.getState();
                const exportData = mapManuscriptToJuz(state);
                await saveToOPFS(STORAGE_KEYS.juz, exportData);
                return true;
            } catch (err) {
                console.error('Failed to save manuscript to OPFS:', err);
                return false;
            }
        },
        savedIds: [],
        saveId: (id) =>
            set((state) => {
                state.savedIds.push(id);
            }),
        searchAndReplace: (...args) =>
            set((state) => {
                actions.searchAndReplace(state, ...args);
            }),
        setUrl: (url) =>
            set((state) => {
                state.url = url;
            }),
        sheets: [],
        splitAltAtLineBreak: (...args) =>
            set((state) => {
                actions.splitAltAtLineBreak(state, ...args);
            }),
        toggleFootnotes: (...args) =>
            set((state) => {
                actions.toggleFootnotes(state, ...args);
            }),
        updatePageNumber: (...args) =>
            set((state) => {
                actions.updatePageNumber(state, ...args);
            }),
        updatePages: (...args) =>
            set((state) => {
                actions.updatePages(state, ...args);
            }),
        updateTextLines: (...args) =>
            set((state) => {
                actions.updateTextLines(state, ...args);
            }),
        url: '',
    })),
);
