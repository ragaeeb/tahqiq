import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { RuleConfig, SegmentationState } from './types';

// Enable Immer's MapSet plugin for Set/Map support
enableMapSet();

const INITIAL_STATE = {
    allLineStarts: [],
    ruleConfigs: [],
    selectedPatterns: new Set<string>(),
    sliceAtPunctuation: true,
};

/**
 * Creates defaults for a new RuleConfig based on pattern content
 */
const createRuleConfigDefaults = (pattern: string): RuleConfig => {
    const containsKitab = pattern.includes('{{kitab}}');
    const containsNaql = pattern.includes('{{naql}}');
    const containsBab = pattern.includes('{{bab}}') || pattern.includes('{{fasl}}');

    return {
        fuzzy: containsKitab || containsNaql,
        metaType: containsKitab ? 'book' : containsBab ? 'chapter' : 'none',
        pattern,
        patternType: 'lineStartsAfter',
        template: pattern,
    };
};

/**
 * Zustand store for segmentation state.
 * Persists across modal open/close cycles.
 */
export const useSegmentationStore = create<SegmentationState>()(
    immer((set) => ({
        ...INITIAL_STATE,

        addCommonPattern: (common) =>
            set((state) => {
                if (state.selectedPatterns.has(common.pattern)) {
                    return; // Already selected
                }
                const newSet = new Set(state.selectedPatterns);
                newSet.add(common.pattern);
                state.selectedPatterns = newSet;
                state.ruleConfigs.push({
                    fuzzy: common.fuzzy,
                    metaType: common.metaType,
                    pattern: common.pattern,
                    patternType: common.patternType,
                    template: common.pattern,
                });
            }),

        moveRule: (fromIndex, toIndex) =>
            set((state) => {
                if (
                    fromIndex >= 0 &&
                    fromIndex < state.ruleConfigs.length &&
                    toIndex >= 0 &&
                    toIndex < state.ruleConfigs.length
                ) {
                    const [moved] = state.ruleConfigs.splice(fromIndex, 1);
                    state.ruleConfigs.splice(toIndex, 0, moved);
                }
            }),

        reset: () =>
            set((state) => {
                Object.assign(state, INITIAL_STATE);
            }),

        setAllLineStarts: (patterns) =>
            set((state) => {
                state.allLineStarts = patterns;
                state.selectedPatterns = new Set();
                state.ruleConfigs = [];
            }),

        setRuleConfigs: (configs) =>
            set((state) => {
                state.ruleConfigs = configs;
            }),

        setSliceAtPunctuation: (value) =>
            set((state) => {
                state.sliceAtPunctuation = value;
            }),

        togglePattern: (pattern) =>
            set((state) => {
                const newSet = new Set(state.selectedPatterns);
                if (newSet.has(pattern)) {
                    newSet.delete(pattern);
                    // Remove from ruleConfigs
                    state.ruleConfigs = state.ruleConfigs.filter((r) => r.pattern !== pattern);
                } else {
                    newSet.add(pattern);
                    // Add to ruleConfigs with defaults
                    state.ruleConfigs.push(createRuleConfigDefaults(pattern));
                }
                state.selectedPatterns = newSet;
            }),

        updateRuleConfig: (index, updates) =>
            set((state) => {
                if (index >= 0 && index < state.ruleConfigs.length) {
                    Object.assign(state.ruleConfigs[index], updates);
                }
            }),
    })),
);
