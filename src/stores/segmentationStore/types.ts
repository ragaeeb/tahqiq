import type { CommonLineStartPattern, PatternTypeKey, SegmentationOptions, TokenMapping } from 'flappa-doormal';
import type { Replacement } from '@/lib/replace';

export type BookSegmentationOptions = SegmentationOptions & { replace: Replacement[]; minWordsPerSegment: number };

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

export const DEFAULT_TOKEN_MAPPINGS: TokenMapping[] = [
    { name: 'num', token: 'raqms' },
    { name: 'rumuz', token: 'rumuz' },
];

export type SegmentationState = {
    // Pattern analysis
    allLineStarts: CommonLineStartPattern[];

    // Rule configuration
    ruleConfigs: RuleConfig[];

    // Token mappings (apply to all rules)
    tokenMappings: TokenMapping[];

    options: BookSegmentationOptions;

    setAllLineStarts: (patterns: CommonLineStartPattern[]) => void;
    setRuleConfigs: (configs: RuleConfig[]) => void;
    setTokenMappings: (mappings: TokenMapping[]) => void;
    setOptions: (options: BookSegmentationOptions) => void;
    updateOptions: (patch: Partial<BookSegmentationOptions>) => void;
    reset: () => void;
};
