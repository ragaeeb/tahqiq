import { type Token } from 'paragrafs';
import { create } from 'zustand';

import {
    DEFAULT_FILLER_WORDS,
    DEFAULT_HINTS,
    DEFAULT_MAX_SECONDS_PER_LINE,
    DEFAULT_MAX_SECONDS_PER_SEGMENT,
    DEFAULT_MIN_WORDS_PER_SEGMENT,
    DEFAULT_SILENCE_GAP_THRESHOLD,
} from '@/lib/constants';

import type { FormatOptions, TranscriptState } from './types';

import {
    applySelection,
    groupAndSliceSegments,
    initStore,
    markSelectedDone,
    mergeSelectedSegments,
    removeSelectedSegments,
    selectAllSegments,
    splitSelectedSegment,
    updateSegmentWithDiff,
} from './actions';

/**
 * Creates a Zustand store for managing transcript state
 * Provides actions for manipulating transcript data, segments, and selection
 * Initializes with default formatting options from constants
 *
 * @returns A Zustand store with transcript state and actions
 */
export const useTranscriptStore = create<TranscriptState>((set) => {
    return {
        createdAt: new Date(),
        deleteSelectedSegments: () => {
            set(removeSelectedSegments);
        },
        formatOptions: {
            fillers: DEFAULT_FILLER_WORDS,
            flipPunctuation: true,
            hints: DEFAULT_HINTS,
            maxSecondsPerLine: DEFAULT_MAX_SECONDS_PER_LINE,
            maxSecondsPerSegment: DEFAULT_MAX_SECONDS_PER_SEGMENT,
            minWordsPerSegment: DEFAULT_MIN_WORDS_PER_SEGMENT,
            silenceGapThreshold: DEFAULT_SILENCE_GAP_THRESHOLD,
        },
        groupAndSliceSegments: () => {
            set(groupAndSliceSegments);
        },
        init: (data) => set(() => initStore(data)),
        markCompleted: () => {
            set(markSelectedDone);
        },
        mergeSegments: () => {
            set(mergeSelectedSegments);
        },
        selectAllSegments: (isSelected: boolean) => {
            return set((state) => selectAllSegments(state, isSelected));
        },
        selectedPart: 0,
        selectedSegments: [],
        selectedToken: null,
        setFormattingOptions: (formatOptions: FormatOptions) => {
            return set({ formatOptions });
        },
        setSelectedPart: (selectedPart) => set({ selectedPart, selectedSegments: [] }),
        setSelectedToken: (token: null | Token) => set({ selectedToken: token }),
        splitSegment: () => {
            return set(splitSelectedSegment);
        },
        toggleSegmentSelection: (segment, isSelected) => set((state) => applySelection(state, segment, isSelected)),
        transcripts: {},
        updateSegment: (segmentStart, update) => set((state) => updateSegmentWithDiff(state, segmentStart, update)),
    };
});
