import type { CommonLineStartPattern } from 'flappa-doormal';

export type RuleConfig = {
    pattern: string; // Original from selection (immutable, used for sync)
    template: string | string[]; // Editable, can be array for merged rules
    patternType: 'lineStartsWith' | 'lineStartsAfter';
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

/**
 * Token mapping for auto-applying named groups to templates
 */
export type TokenMapping = {
    token: string; // e.g., "raqms"
    name: string; // e.g., "num" -> transforms {{raqms}} to {{raqms:num}}
};

export const DEFAULT_TOKEN_MAPPINGS: TokenMapping[] = [
    { name: 'num', token: 'raqms' },
    { name: 'rumuz', token: 'rumuz' },
];

/**
 * Replacement pair for pre-processing page content before segmentation.
 * Matches the flappa-doormal Replacement type (without optional fields).
 */
export type Replacement = {
    regex: string; // Raw regex source string
    replacement: string; // Replacement string
};

export type SegmentationState = {
    // Pattern analysis
    allLineStarts: CommonLineStartPattern[];
    selectedPatterns: Set<string>;

    // Rule configuration
    ruleConfigs: RuleConfig[];
    sliceAtPunctuation: boolean;

    // Token mappings (apply to all rules)
    tokenMappings: TokenMapping[];

    // Pre-processing replacements
    replacements: Replacement[];

    // Actions
    setAllLineStarts: (patterns: CommonLineStartPattern[]) => void;
    togglePattern: (pattern: string) => void;
    addCommonPattern: (common: CommonPattern) => void;
    setRuleConfigs: (configs: RuleConfig[]) => void;
    updateRuleConfig: (index: number, updates: Partial<RuleConfig>) => void;
    moveRule: (fromIndex: number, toIndex: number) => void;
    sortRulesByLength: () => void;
    mergeSelectedRules: (selectedPatterns: string[]) => void;
    setSliceAtPunctuation: (value: boolean) => void;
    setTokenMappings: (mappings: TokenMapping[]) => void;
    setReplacements: (replacements: Replacement[]) => void;
    reset: () => void;
};
