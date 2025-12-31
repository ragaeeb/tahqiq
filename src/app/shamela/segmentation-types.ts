/**
 * Types for segmentation dialog state and configuration.
 */

/**
 * Pattern type options for split rules
 */
export type PatternType = 'lineStartsWith' | 'lineStartsAfter' | 'lineEndsWith' | 'template' | 'regex';

/**
 * Meta type options for segment categorization
 */
export type MetaType = 'chapter' | 'hadith' | 'book' | 'section' | 'verse';

/**
 * Form state for a single split rule
 */
export type RuleFormState = {
    /** Unique ID for the rule */
    id: string;
    /** Pattern type determines which field to use */
    patternType: PatternType;
    /** Patterns for lineStartsWith, lineStartsAfter, lineEndsWith (array) */
    patterns: string[];
    /** Split behavior: 'at' starts new segment at match, 'after' starts after match */
    split: 'at' | 'after';
    /** Which occurrences to split on */
    occurrence?: 'first' | 'last' | 'all';
    /** Enable diacritic-insensitive matching for Arabic */
    fuzzy?: boolean;
    /** Minimum page ID for this rule to apply */
    min?: number;
    /** Maximum page ID for this rule to apply */
    max?: number;
    /** Segment type metadata */
    metaType?: MetaType;
};

/**
 * Form state for a breakpoint pattern
 */
export type BreakpointFormState = {
    /** Unique ID for the breakpoint */
    id: string;
    /** Pattern (supports token expansion). Empty string = page boundary fallback */
    pattern: string;
    /** Minimum page ID for this breakpoint to apply */
    min?: number;
    /** Maximum page ID for this breakpoint to apply */
    max?: number;
    /** Comma-separated page list/ranges to exclude */
    exclude?: string;
};

/**
 * Complete form state for segmentation configuration
 */
export type SegmentationFormState = {
    /** Array of split rules */
    rules: RuleFormState[];
    /** Array of breakpoint patterns */
    breakpoints: BreakpointFormState[];
    /** Maximum pages per segment before breakpoints apply */
    maxPages?: number;
    /** When multiple breakpoint matches exist, prefer longer or shorter segments */
    prefer: 'longer' | 'shorter';
};

/**
 * Preset configuration for common book types
 */
export type SegmentationPreset = {
    /** Preset name */
    name: string;
    /** Description of when to use this preset */
    description: string;
    /** Pre-configured rules and settings */
    config: SegmentationFormState;
};

/**
 * Storage key for persisted rules
 */
export const SEGMENTATION_STORAGE_KEY = 'segmentation-config';

/**
 * Creates a new empty rule with default values
 */
export const createEmptyRule = (): RuleFormState => ({
    fuzzy: false,
    id: crypto.randomUUID(),
    occurrence: 'all',
    patterns: [''],
    patternType: 'lineStartsAfter',
    split: 'at',
});

/**
 * Creates a new empty breakpoint with default values
 */
export const createEmptyBreakpoint = (): BreakpointFormState => ({ id: crypto.randomUUID(), pattern: '' });

/**
 * Default segmentation form state
 */
export const DEFAULT_FORM_STATE: SegmentationFormState = { breakpoints: [], maxPages: 1, prefer: 'longer', rules: [] };

/**
 * Preset configurations for common book types
 */
export const PRESETS: SegmentationPreset[] = [
    {
        config: {
            breakpoints: [],
            maxPages: undefined,
            prefer: 'longer',
            rules: [
                {
                    fuzzy: false,
                    id: 'r0',
                    occurrence: 'last',
                    // Template pattern for splitting at tarqim (punctuation)
                    // occurrence: 'last' means prefer longer segments
                    patterns: ['{{tarqim}}\\s*'],
                    patternType: 'template',
                    split: 'after',
                },
                {
                    fuzzy: true,
                    id: 'r1',
                    metaType: 'chapter',
                    patterns: ['{{basmalah}}'],
                    patternType: 'lineStartsWith',
                    split: 'at',
                },
                {
                    fuzzy: true,
                    id: 'r2',
                    metaType: 'chapter',
                    patterns: ['{{bab}}'],
                    patternType: 'lineStartsWith',
                    split: 'at',
                },
                {
                    fuzzy: false,
                    id: 'r3',
                    metaType: 'hadith',
                    patterns: ['{{raqms:num}} {{dash}}'],
                    patternType: 'lineStartsAfter',
                    split: 'at',
                },
                {
                    fuzzy: false,
                    id: 'r4',
                    metaType: 'chapter',
                    patterns: ['##'],
                    patternType: 'lineStartsAfter',
                    split: 'at',
                },
            ],
        },
        description: 'For hadith collections like Bukhari, Muslim, etc.',
        name: 'Hadith Book',
    },
    {
        config: {
            breakpoints: [
                { id: 'bp1', pattern: '{{tarqim}}\\s*' },
                { id: 'bp2', pattern: '' },
            ],
            maxPages: 10,
            prefer: 'longer',
            rules: [
                {
                    fuzzy: true,
                    id: 'r1',
                    metaType: 'chapter',
                    patterns: ['{{fasl}}'],
                    patternType: 'lineStartsWith',
                    split: 'at',
                },
                {
                    fuzzy: false,
                    id: 'r2',
                    metaType: 'section',
                    patterns: ['## {{raqms:num}} {{dash}}'],
                    patternType: 'lineStartsAfter',
                    split: 'at',
                },
                {
                    fuzzy: false,
                    id: 'r3',
                    metaType: 'chapter',
                    patterns: ['##'],
                    patternType: 'lineStartsAfter',
                    split: 'at',
                },
            ],
        },
        description: 'For fiqh books like Al-Mughni, etc.',
        name: 'Fiqh Book',
    },
    {
        config: {
            breakpoints: [
                { id: 'bp1', pattern: '{{tarqim}}\\s*' },
                { id: 'bp2', pattern: '' },
            ],
            maxPages: 10,
            prefer: 'longer',
            rules: [
                { fuzzy: true, id: 'r1', patterns: ['{{basmalah}}'], patternType: 'lineStartsWith', split: 'at' },
                {
                    fuzzy: true,
                    id: 'r2',
                    metaType: 'book',
                    patterns: ['{{kitab}}'],
                    patternType: 'lineStartsWith',
                    split: 'at',
                },
                {
                    fuzzy: true,
                    id: 'r3',
                    metaType: 'chapter',
                    patterns: ['{{bab}}'],
                    patternType: 'lineStartsWith',
                    split: 'at',
                },
                {
                    fuzzy: false,
                    id: 'r4',
                    metaType: 'chapter',
                    patterns: ['##'],
                    patternType: 'lineStartsAfter',
                    split: 'at',
                },
            ],
        },
        description: 'Generic book with kitab/bab structure',
        name: 'General (Kitab/Bab)',
    },
];
