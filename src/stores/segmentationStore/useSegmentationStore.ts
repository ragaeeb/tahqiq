import { Token } from 'flappa-doormal';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { SHORT_SEGMENT_WORD_THRESHOLD } from '@/lib/constants';
import { DEFAULT_TOKEN_MAPPINGS, type SegmentationState } from './types';

const INITIAL_STATE = {
    allLineStarts: [],
    // Unified options now include replace
    options: {
        breakpoints: [{ pattern: Token.TARQIM }, ''],
        maxPages: 1,
        minWordsPerSegment: SHORT_SEGMENT_WORD_THRESHOLD,
        replace: [],
        rules: [],
    },
    ruleConfigs: [],
    tokenMappings: DEFAULT_TOKEN_MAPPINGS,
};

/**
 * Zustand store for segmentation state.
 * Persists across modal open/close cycles.
 */
export const useSegmentationStore = create<SegmentationState>()(
    immer((set) => ({
        ...INITIAL_STATE,
        reset: () =>
            set((state) => {
                Object.assign(state, INITIAL_STATE);
            }),

        setAllLineStarts: (patterns) =>
            set((state) => {
                state.allLineStarts = patterns;
                state.ruleConfigs = [];
            }),

        setOptions: (options) =>
            set((state) => {
                state.options = { ...options, rules: options.rules ?? [] };
            }),

        setRuleConfigs: (configs) =>
            set((state) => {
                state.ruleConfigs = configs;
            }),

        setTokenMappings: (mappings) =>
            set((state) => {
                state.tokenMappings = mappings;
            }),

        updateOptions: (patch) =>
            set((state) => {
                state.options = { ...state.options, ...patch };
            }),
    })),
);
