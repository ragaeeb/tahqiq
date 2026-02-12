import type { Token } from 'paragrafs';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import {
    DEFAULT_FILLER_WORDS,
    DEFAULT_HINTS,
    DEFAULT_MAX_SECONDS_PER_LINE,
    DEFAULT_MAX_SECONDS_PER_SEGMENT,
    DEFAULT_MIN_WORDS_PER_SEGMENT,
    DEFAULT_SILENCE_GAP_THRESHOLD,
    STORAGE_KEYS,
} from '@/lib/constants';
import { saveToOPFS } from '@/lib/io';
import { mapTranscriptsToLatestContract } from '@/lib/legacy';
import {
    addTranscriptsFromFiles,
    applySelection,
    groupAndSliceSegments,
    initStore,
    markSelectedDone,
    mergeSelectedSegments,
    rebuildSegmentFromTokens,
    removeSelectedSegments,
    selectAllSegments,
    setUrlsForTranscript,
    splitSelectedSegment,
    updateSegmentWithDiff,
} from './actions';
import type { FormatOptions, TranscriptState } from './types';

/**
 * Creates a Zustand store for managing transcript state
 * Provides actions for manipulating transcript data, segments, and selection
 * Initializes with default formatting options from constants
 * Uses Immer for immutable updates which provides better DX and performance.
 *
 * @returns A Zustand store with transcript state and actions
 */
export const useTranscriptStore = create<TranscriptState>()(
    immer((set) => ({
        addTranscripts: (...args) =>
            set((state) => {
                const result = addTranscriptsFromFiles(state, args);
                Object.assign(state, result);
            }),
        createdAt: new Date(),
        deleteSelectedSegments: () =>
            set((state) => {
                const result = removeSelectedSegments(state);
                Object.assign(state, result);
            }),
        formatOptions: {
            fillers: DEFAULT_FILLER_WORDS,
            flipPunctuation: true,
            hints: DEFAULT_HINTS,
            maxSecondsPerLine: DEFAULT_MAX_SECONDS_PER_LINE,
            maxSecondsPerSegment: DEFAULT_MAX_SECONDS_PER_SEGMENT,
            minWordsPerSegment: DEFAULT_MIN_WORDS_PER_SEGMENT,
            silenceGapThreshold: DEFAULT_SILENCE_GAP_THRESHOLD,
        },
        groupAndSliceSegments: () =>
            set((state) => {
                const result = groupAndSliceSegments(state);
                Object.assign(state, result);
            }),
        init: (data) =>
            set((state) => {
                const result = initStore(data);
                Object.assign(state, result);
            }),
        markCompleted: () =>
            set((state) => {
                const result = markSelectedDone(state);
                Object.assign(state, result);
            }),
        mergeSegments: () =>
            set((state) => {
                const result = mergeSelectedSegments(state);
                Object.assign(state, result);
            }),
        postProcessingApps: [],
        rebuildSegmentFromTokens: () =>
            set((state) => {
                const result = rebuildSegmentFromTokens(state);
                Object.assign(state, result);
            }),
        reset: () =>
            set((state) => {
                state.createdAt = new Date();
                state.postProcessingApps = [];
                state.selectedPart = 0;
                state.selectedSegments = [];
                state.selectedToken = null;
                state.transcripts = {};
            }),
        save: async () => {
            try {
                const state = useTranscriptStore.getState();
                const exportData = mapTranscriptsToLatestContract(state);
                await saveToOPFS(STORAGE_KEYS.transcript, exportData);
                return true;
            } catch (err) {
                console.error('Failed to save transcript to OPFS:', err);
                return false;
            }
        },
        selectAllSegments: (isSelected: boolean) =>
            set((state) => {
                const result = selectAllSegments(state, isSelected);
                Object.assign(state, result);
            }),
        selectedPart: 0,
        selectedSegments: [],
        selectedToken: null,
        setFormattingOptions: (formatOptions: FormatOptions) =>
            set((state) => {
                state.formatOptions = formatOptions;
            }),
        setSelectedPart: (selectedPart) =>
            set((state) => {
                state.selectedPart = selectedPart;
                state.selectedSegments = [];
            }),
        setSelectedToken: (token: null | Token) =>
            set((state) => {
                state.selectedToken = token;
            }),
        splitSegment: () =>
            set((state) => {
                const result = splitSelectedSegment(state);
                Object.assign(state, result);
            }),
        toggleSegmentSelection: (segment, isSelected) =>
            set((state) => {
                const result = applySelection(state, segment, isSelected);
                Object.assign(state, result);
            }),
        transcripts: {},
        updateSegment: (segmentStart, update, shouldForceRefresh) =>
            set((state) => {
                const result = updateSegmentWithDiff(state, segmentStart, update, shouldForceRefresh);
                Object.assign(state, result);
            }),
        updateUrlsForTranscript: (urls) =>
            set((state) => {
                const result = setUrlsForTranscript(state, urls);
                Object.assign(state, result);
            }),
        urls: [],
    })),
);
