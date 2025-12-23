import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
    DEFAULT_TOKEN_MAPPINGS,
    type Replacement,
    type RuleConfig,
    type SegmentationState,
    type TokenMapping,
} from './types';

// Enable Immer's MapSet plugin for Set/Map support
enableMapSet();

const INITIAL_STATE = {
    allLineStarts: [],
    replacements: [] as Replacement[],
    ruleConfigs: [],
    selectedPatterns: new Set<string>(),
    sliceAtPunctuation: true,
    tokenMappings: DEFAULT_TOKEN_MAPPINGS as TokenMapping[],
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
        pageStartGuard: false,
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
                    pageStartGuard: false,
                    pattern: common.pattern,
                    patternType: common.patternType,
                    template: common.pattern,
                });
            }),

        mergeSelectedRules: (selectedPatterns) =>
            set((state) => {
                if (selectedPatterns.length < 2) {
                    return;
                }

                // Get rules in order they appear
                const rulesToMerge = state.ruleConfigs.filter((r) => selectedPatterns.includes(r.pattern));
                if (rulesToMerge.length < 2) {
                    return;
                }

                // Validate all have same patternType
                const firstType = rulesToMerge[0].patternType;
                if (!rulesToMerge.every((r) => r.patternType === firstType)) {
                    return;
                }

                // Find insertion index (first rule's position)
                const insertIndex = state.ruleConfigs.findIndex((r) => r.pattern === rulesToMerge[0].pattern);

                // Collect all templates (flatten arrays)
                const allTemplates: string[] = [];
                for (const rule of rulesToMerge) {
                    if (Array.isArray(rule.template)) {
                        allTemplates.push(...rule.template);
                    } else {
                        allTemplates.push(rule.template);
                    }
                }

                // Create merged rule, spreading props from subsequent rules onto first
                const mergedRule = { ...rulesToMerge[0] };
                for (let i = 1; i < rulesToMerge.length; i++) {
                    const r = rulesToMerge[i];
                    // Spread truthy/defined props from subsequent rules
                    if (r.fuzzy) {
                        mergedRule.fuzzy = true;
                    }
                    if (r.pageStartGuard) {
                        mergedRule.pageStartGuard = true;
                    }
                    if (r.metaType !== 'none') {
                        mergedRule.metaType = r.metaType;
                    }
                    if (r.min !== undefined) {
                        mergedRule.min = r.min;
                    }
                }
                mergedRule.template = allTemplates;

                // Remove merged rules and insert merged rule
                state.ruleConfigs = state.ruleConfigs.filter((r) => !selectedPatterns.includes(r.pattern));
                state.ruleConfigs.splice(insertIndex, 0, mergedRule);

                // Update selectedPatterns set - remove merged patterns except first
                const newSet = new Set(state.selectedPatterns);
                for (let i = 1; i < rulesToMerge.length; i++) {
                    newSet.delete(rulesToMerge[i].pattern);
                }
                state.selectedPatterns = newSet;
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

        setTokenMappings: (mappings) =>
            set((state) => {
                state.tokenMappings = mappings;
            }),

        setReplacements: (replacements) =>
            set((state) => {
                state.replacements = replacements;
            }),

        sortRulesByLength: () =>
            set((state) => {
                // For sorting, use first template if array, otherwise the string
                const getLength = (t: string | string[]) => (Array.isArray(t) ? (t[0]?.length ?? 0) : t.length);
                state.ruleConfigs.sort((a, b) => getLength(b.template) - getLength(a.template));
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
