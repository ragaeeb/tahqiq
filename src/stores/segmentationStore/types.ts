import type { CommonLineStartPattern } from 'flappa-doormal';

export type RuleConfig = {
    pattern: string; // Original from selection (immutable, used for sync)
    template: string; // Editable, defaults to pattern, used in JSON output
    patternType: 'lineStartsWith' | 'lineStartsAfter';
    fuzzy: boolean;
    metaType: 'none' | 'book' | 'chapter';
    min?: number;
};

/**
 * Common pattern presets with predefined configurations
 */
export type CommonPattern = {
    pattern: string;
    label: string;
    patternType: 'lineStartsWith' | 'lineStartsAfter';
    fuzzy: boolean;
    metaType: 'none' | 'book' | 'chapter';
};

export const COMMON_PATTERNS: CommonPattern[] = [
    { fuzzy: true, label: 'Fasl', metaType: 'none', pattern: '{{fasl}}', patternType: 'lineStartsWith' },
    { fuzzy: true, label: 'Basmalah', metaType: 'none', pattern: '{{basmalah}}', patternType: 'lineStartsWith' },
    { fuzzy: true, label: 'Naql', metaType: 'none', pattern: '{{naql}}', patternType: 'lineStartsWith' },
    { fuzzy: true, label: 'Kitab', metaType: 'book', pattern: '{{kitab}} ', patternType: 'lineStartsWith' },
    { fuzzy: true, label: 'Bab', metaType: 'chapter', pattern: '{{bab}} ', patternType: 'lineStartsWith' },
    { fuzzy: false, label: 'Heading (##)', metaType: 'chapter', pattern: '## ', patternType: 'lineStartsAfter' },
];

export type SegmentationState = {
    // Pattern analysis
    allLineStarts: CommonLineStartPattern[];
    selectedPatterns: Set<string>;

    // Rule configuration
    ruleConfigs: RuleConfig[];
    sliceAtPunctuation: boolean;

    // Actions
    setAllLineStarts: (patterns: CommonLineStartPattern[]) => void;
    togglePattern: (pattern: string) => void;
    addCommonPattern: (common: CommonPattern) => void;
    setRuleConfigs: (configs: RuleConfig[]) => void;
    updateRuleConfig: (index: number, updates: Partial<RuleConfig>) => void;
    moveRule: (fromIndex: number, toIndex: number) => void;
    setSliceAtPunctuation: (value: boolean) => void;
    reset: () => void;
};
