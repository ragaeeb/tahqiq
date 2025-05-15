import { type Token } from 'paragrafs';
import { create } from 'zustand';

import type { FormatOptions, TranscriptState } from './types';

import {
    applySelection,
    groupAndSliceSegments,
    mapFileToTranscript,
    mergeSelectedSegments,
    selectAllSegments,
    splitSelectedSegment,
    updateSegmentWithDiff,
} from './actions';

export const useTranscriptStore = create<TranscriptState>((set) => ({
    groupAndSliceSegments: (options: FormatOptions) => {
        set((state) => groupAndSliceSegments(state, options));
    },
    isInitialized: false,
    mergeSegments: () => {
        set(mergeSelectedSegments);
    },
    selectAllSegments: (isSelected: boolean) => {
        return set((state) => selectAllSegments(state, isSelected));
    },
    selectedPart: 0,
    selectedSegments: [],
    selectedToken: null,
    setSelectedPart: (selectedPart) => set({ selectedPart, selectedSegments: [] }),
    setSelectedToken: (token: null | Token) => set({ selectedToken: token }),
    setTranscripts: (fileToTranscript) => set(() => mapFileToTranscript(fileToTranscript)),
    splitSegment: () => {
        return set(splitSelectedSegment);
    },
    toggleSegmentSelection: (segment, isSelected) => set((state) => applySelection(state, segment, isSelected)),
    transcripts: {},
    updateSegment: (update) => set((state) => updateSegmentWithDiff(state, update)),
}));
