import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import * as actions from './actions';
import type { ExcerptsState } from './types';

/**
 * Creates a Zustand store for managing excerpts state.
 * Uses Immer for immutable updates which provides better DX and performance.
 *
 * @returns A Zustand store with excerpts state and actions
 */
export const useExcerptsStore = create<ExcerptsState>()(
    immer((set) => ({
        applyFootnoteFormatting: (formatFn) =>
            set((state) => {
                actions.applyFootnoteFormatting(state, formatFn);
            }),

        applyHeadingFormatting: (formatFn) =>
            set((state) => {
                actions.applyHeadingFormatting(state, formatFn);
            }),

        applyTranslationFormatting: (formatFn) =>
            set((state) => {
                actions.applyTranslationFormatting(state, formatFn);
            }),
        collection: undefined,
        contractVersion: undefined,
        createdAt: new Date(),

        deleteExcerpts: (ids) =>
            set((state) => {
                actions.deleteExcerpts(state, ids);
            }),

        deleteFootnotes: (ids) =>
            set((state) => {
                actions.deleteFootnotes(state, ids);
            }),

        deleteHeadings: (ids) =>
            set((state) => {
                actions.deleteHeadings(state, ids);
            }),
        excerpts: [],
        footnotes: [],
        headings: [],

        init: (data, fileName) =>
            set((state) => {
                const newState = actions.initStore(data, fileName);
                Object.assign(state, newState);
            }),
        inputFileName: undefined,
        lastUpdatedAt: undefined,
        options: undefined,
        postProcessingApps: [],
        prompt: undefined,

        reset: () =>
            set((state) => {
                state.collection = undefined;
                state.contractVersion = undefined;
                state.createdAt = new Date();
                state.excerpts = [];
                state.footnotes = [];
                state.headings = [];
                state.inputFileName = undefined;
                state.lastUpdatedAt = undefined;
                state.options = undefined;
                state.postProcessingApps = [];
                state.prompt = undefined;
            }),

        updateExcerpt: (id, updates) =>
            set((state) => {
                actions.updateExcerpt(state, id, updates);
            }),

        updateFootnote: (id, updates) =>
            set((state) => {
                actions.updateFootnote(state, id, updates);
            }),

        updateHeading: (id, updates) =>
            set((state) => {
                actions.updateHeading(state, id, updates);
            }),
    })),
);
