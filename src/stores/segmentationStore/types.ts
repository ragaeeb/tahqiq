import type {
    CommonLineStartPattern,
    PatternTypeKey,
    RepeatingSequencePattern,
    ReplaceRule,
    SegmentationOptions,
    TokenMapping,
} from 'flappa-doormal';

export type AnalysisMode = 'lineStarts' | 'repeatingSequences';

export type SegmentationOptionsState = Omit<SegmentationOptions, 'replace' | 'rules'> & {
    replace: NonNullable<SegmentationOptions['replace']>;
    rules: NonNullable<SegmentationOptions['rules']>;
};

export type RuleConfig = {
    pattern: string; // Original from selection (immutable, used for sync)
    template: string | string[]; // Editable, can be array for merged rules
    patternType: Extract<PatternTypeKey, 'lineStartsWith' | 'lineStartsAfter' | 'template'>;
    fuzzy: boolean;
    pageStartGuard: boolean;
    metaType: 'none' | 'book' | 'chapter';
    min?: number;
    meta?: Record<string, unknown>; // Full meta object for custom values (takes precedence over metaType)
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

export const DEFAULT_TOKEN_MAPPINGS: TokenMapping[] = [
    { name: 'num', token: 'raqms' },
    { name: 'rumuz', token: 'rumuz' },
];

export type SegmentationState = {
    // Pattern analysis
    allLineStarts: CommonLineStartPattern[];
    allRepeatingSequences: RepeatingSequencePattern[];
    analysisMode: AnalysisMode;
    selectedPatterns: Set<string>;

    // Rule configuration
    ruleConfigs: RuleConfig[];
    sliceAtPunctuation: boolean;

    // Token mappings (apply to all rules)
    tokenMappings: TokenMapping[];

    // Pre-processing replacements
    replacements: ReplaceRule[];

    options: SegmentationOptionsState;

    // Actions
    setAllLineStarts: (patterns: CommonLineStartPattern[]) => void;
    setAllRepeatingSequences: (patterns: RepeatingSequencePattern[]) => void;
    setAnalysisMode: (mode: AnalysisMode) => void;
    togglePattern: (pattern: string) => void;
    addCommonPattern: (common: CommonPattern) => void;
    setRuleConfigs: (configs: RuleConfig[]) => void;
    updateRuleConfig: (index: number, updates: Partial<RuleConfig>) => void;
    moveRule: (fromIndex: number, toIndex: number) => void;
    sortRulesByLength: () => void;
    mergeSelectedRules: (selectedPatterns: string[]) => void;
    setSliceAtPunctuation: (value: boolean) => void;
    setTokenMappings: (mappings: TokenMapping[]) => void;
    setReplacements: (replacements: ReplaceRule[]) => void;
    setOptions: (options: SegmentationOptions) => void;
    updateOptions: (patch: Partial<SegmentationOptions>) => void;
    reset: () => void;
};
