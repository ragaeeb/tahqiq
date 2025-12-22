import type { CommonLineStartPattern } from 'flappa-doormal';

export type RuleConfig = {
    pattern: string; // Original from selection (immutable, used for sync)
    template: string; // Editable, defaults to pattern, used in JSON output
    patternType: 'lineStartsWith' | 'lineStartsAfter';
    fuzzy: boolean;
    metaType: 'none' | 'book' | 'chapter';
    min?: number;
};

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
    setRuleConfigs: (configs: RuleConfig[]) => void;
    updateRuleConfig: (index: number, updates: Partial<RuleConfig>) => void;
    moveRule: (fromIndex: number, toIndex: number) => void;
    setSliceAtPunctuation: (value: boolean) => void;
    reset: () => void;
};
