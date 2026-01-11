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
        // Spread initial state values
        ...actions.INITIAL_STATE,

        applyBulkTranslations: (translationMap, translator) => {
            let result = { total: 0, updated: 0 };
            set((state) => {
                result = actions.applyBulkTranslations(state, translationMap, translator);
            });
            return result;
        },

        applyExcerptNassFormatting: (formatFn) =>
            set((state) => {
                actions.applyExcerptNassFormatting(state, formatFn);
            }),

        applyFootnoteFormatting: (formatFn) =>
            set((state) => {
                actions.applyFootnoteFormatting(state, formatFn);
            }),

        applyFootnoteNassFormatting: (formatFn) =>
            set((state) => {
                actions.applyFootnoteNassFormatting(state, formatFn);
            }),

        applyHeadingFormatting: (formatFn) =>
            set((state) => {
                actions.applyHeadingFormatting(state, formatFn);
            }),

        applyHeadingNassFormatting: (formatFn) =>
            set((state) => {
                actions.applyHeadingNassFormatting(state, formatFn);
            }),

        applyTranslationFormatting: (formatFn) =>
            set((state) => {
                actions.applyTranslationFormatting(state, formatFn);
            }),

        createExcerptFromExisting: (sourceId, newArabicText) =>
            set((state) => {
                actions.createExcerptFromExisting(state, sourceId, newArabicText);
            }),

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

        filterExcerptsByIds: (ids) =>
            set((state) => {
                actions.filterExcerptsByIds(state, ids);
            }),

        filterFootnotesByIds: (ids) =>
            set((state) => {
                actions.filterFootnotesByIds(state, ids);
            }),

        filterHeadingsByIds: (ids) =>
            set((state) => {
                actions.filterHeadingsByIds(state, ids);
            }),

        init: (data, fileName) =>
            set((state) => {
                const newState = actions.initStore(data, fileName);
                Object.assign(state, newState);
            }),

        markAsSentToLlm: (ids) =>
            set((state) => {
                actions.markAsSentToLlm(state, ids);
            }),

        mergeExcerpts: (ids) => {
            let result = false;
            set((state) => {
                result = actions.mergeExcerpts(state, ids);
            });
            return result;
        },

        reset: () =>
            set((state) => {
                const newState = actions.resetStore();
                Object.assign(state, newState);
            }),

        resetSentToLlm: () =>
            set((state) => {
                actions.resetSentToLlm(state);
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
