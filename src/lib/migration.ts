import type {
    Entry,
    Excerpt,
    Excerpts,
    Heading,
    LegacyMatnParseOptions,
    MatnParseOptions,
} from '@/stores/excerptsStore/types';

/**
 * SlicingOption type for the new format.
 *
 * NOTE: Local type definitions are intentional for migration logic.
 * These types represent the TARGET format for migration output and may differ
 * from the runtime types in stores/excerptsStore/types.ts. Keeping them local
 * ensures migration logic remains stable even if the runtime types evolve,
 * and makes it clear these are migration-specific structures.
 */
type SlicingOption = {
    lineStartsWith?: string[];
    regex?: string;
    meta?: { type?: 'chapter' | 'book' };
    min?: number;
    max?: number;
};

/**
 * Legacy pattern options from patternToOptions.
 * Local definition for migration stability (see SlicingOption comment).
 */
type LegacyPatternOptions = { maxPage?: number; minPage?: number; type?: number };

/**
 * Converts Unicode escape sequences to template tokens
 * - [\u0660-\u0669]+ → {{raqms}}
 * - [\u0660-\u0669] → {{raqm}}
 * - [-–—ـ] → {{dash}}
 */
const convertToTemplateTokens = (pattern: string): string => {
    return pattern
        .replace(/\[\\u0660-\\u0669\]\+/g, '{{raqms}}')
        .replace(/\[\\u0660-\\u0669\]/g, '{{raqm}}')
        .replace(/\[-–—ـ\]/g, '{{dash}}');
};

/**
 * Extracts literal words from alternation patterns
 * e.g., "بَابُ|word2|word3" → ["بَابُ", "word2", "word3"]
 */
const extractAlternations = (pattern: string): string[] => {
    // Split by | and filter out empty strings
    return pattern.split('|').filter((s) => s.trim().length > 0);
};

/**
 * Checks if parentheses in a string are balanced
 */
const isBalancedParentheses = (str: string): boolean => {
    let depth = 0;
    for (const char of str) {
        if (char === '(') {
            depth++;
        }
        if (char === ')') {
            depth--;
        }
        if (depth < 0) {
            return false;
        }
    }
    return depth === 0;
};

/**
 * Unwraps outer parentheses from a pattern if balanced
 */
const unwrapParentheses = (pattern: string): string => {
    while (pattern.startsWith('(') && pattern.endsWith(')')) {
        const inner = pattern.slice(1, -1);
        if (isBalancedParentheses(inner)) {
            pattern = inner;
        } else {
            break;
        }
    }
    return pattern;
};

/**
 * Parses a regex pattern string and extracts line-start patterns
 * Returns an array of template patterns for lineStartsWith
 */
const parseRegexPattern = (regexKey: string): string[] => {
    let pattern = regexKey;

    // Strip leading ^
    if (pattern.startsWith('^')) {
        pattern = pattern.slice(1);
    }

    // Remove outer capturing groups and trailing .*
    const outerGroupMatch = pattern.match(/^\(+(.+?)\)*(\.\*)?\)*$/);
    if (outerGroupMatch) {
        pattern = outerGroupMatch[1]!;
    }

    // Remove trailing .* and unwrap parentheses
    pattern = pattern.replace(/\.\*$/, '');
    pattern = unwrapParentheses(pattern);
    pattern = convertToTemplateTokens(pattern);

    // Check if this is an alternation pattern
    return pattern.includes('|') ? extractAlternations(pattern) : [pattern];
};

/**
 * Converts legacy type number to new type string
 */
const convertType = (type?: number): 'chapter' | 'book' | undefined => {
    if (type === 2) {
        return 'chapter';
    }
    if (type === 1) {
        return 'book';
    }
    return undefined;
};

/**
 * Migrates patternToOptions to slicingOptions format
 */
export const migratePatternToOptions = (
    patternToOptions: Record<string, LegacyPatternOptions> | undefined,
): SlicingOption[] | undefined => {
    if (!patternToOptions || Object.keys(patternToOptions).length === 0) {
        return undefined;
    }

    const slicingOptions: SlicingOption[] = [];

    for (const [regexKey, options] of Object.entries(patternToOptions)) {
        const lineStartsWith = parseRegexPattern(regexKey);
        const type = convertType(options.type);

        const slicingOption: SlicingOption = { lineStartsWith };

        // Add meta if type is present
        if (type) {
            slicingOption.meta = { type };
        }

        // Add min/max page constraints
        if (options.minPage !== undefined) {
            slicingOption.min = options.minPage;
        }
        if (options.maxPage !== undefined) {
            slicingOption.max = options.maxPage;
        }

        slicingOptions.push(slicingOption);
    }

    return slicingOptions;
};

/**
 * Omit option types for the new format
 */
type OmitPageByPattern = { regex: string };
type OmitPageByRange = { from: number; to?: number };
type OmitPageNumbers = { pages: number[] };
type OmitPagesOption = OmitPageByPattern | OmitPageByRange | OmitPageNumbers;

/**
 * Parses a page range string into OmitPagesOption
 * Formats: "1-33" (range), "1,3,5" (list), "5" (single page)
 */
const parsePageRange = (rangeStr: string): OmitPagesOption | null => {
    const trimmed = rangeStr.trim();

    // Range format: "1-33"
    if (trimmed.includes('-')) {
        const [fromStr, toStr] = trimmed.split('-');
        const from = Number.parseInt(fromStr!, 10);
        const to = Number.parseInt(toStr!, 10);
        if (!Number.isNaN(from) && !Number.isNaN(to)) {
            return { from, to };
        }
        return null;
    }

    // List format: "1,3,5" or single: "5"
    const pages = trimmed
        .split(',')
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n));

    if (pages.length > 0) {
        return { pages };
    }

    return null;
};

/**
 * Migrates excludePages and excludePagesWithPatterns to omit format
 */
export const migrateExcludePages = (
    excludePages?: string[],
    excludePagesWithPatterns?: string[],
): OmitPagesOption[] | undefined => {
    const omit: OmitPagesOption[] = [];

    // Migrate excludePages
    if (excludePages) {
        for (const rangeStr of excludePages) {
            const parsed = parsePageRange(rangeStr);
            if (parsed) {
                omit.push(parsed);
            }
        }
    }

    // Migrate excludePagesWithPatterns
    if (excludePagesWithPatterns) {
        for (const pattern of excludePagesWithPatterns) {
            omit.push({ regex: pattern });
        }
    }

    return omit.length > 0 ? omit : undefined;
};

/**
 * Replacement option for the new format
 */
type TemplatePatternObj = { template: string };
type RegexPattern = { regex: string };
type ReplacementMatch = TemplatePatternObj | RegexPattern;
type ReplacementOption = { from: ReplacementMatch; to: string; page?: number };

/**
 * Checks if a pattern contains Unicode escape sequences that can be converted to tokens
 */
const containsConvertiblePatterns = (pattern: string): boolean => {
    return pattern.includes('[\\u0660-\\u0669]') || pattern.includes('[-–—ـ]');
};

/**
 * Migrates replacements Record to replace array format
 * Prefers template tokens over raw regex when possible
 * Old format: {"Text": "", "X": "Y"} (applies globally)
 * New format: [{ from: { template: "{{raqms}}" }, to: "" }] or [{ from: { regex: "Text" }, to: "" }]
 */
export const migrateReplacements = (replacements?: Record<string, string>): ReplacementOption[] | undefined => {
    if (!replacements || Object.keys(replacements).length === 0) {
        return undefined;
    }

    const replace: ReplacementOption[] = [];

    for (const [pattern, replacement] of Object.entries(replacements)) {
        let from: ReplacementMatch;

        if (containsConvertiblePatterns(pattern)) {
            // Convert to template pattern
            const template = convertToTemplateTokens(pattern);
            from = { template };
        } else {
            // Keep as regex
            from = { regex: pattern };
        }

        replace.push({ from, to: replacement });
    }

    return replace;
};

/**
 * Combined type for handling both legacy and current options during migration
 */
type CombinedMatnParseOptions = LegacyMatnParseOptions & MatnParseOptions;

/**
 * Migrates options object, converting deprecated fields to new format
 */
const migrateOptions = (options?: CombinedMatnParseOptions): MatnParseOptions | undefined => {
    if (!options) {
        return undefined;
    }

    const {
        patternToOptions,
        excludePages,
        excludePagesWithPatterns,
        replacements,
        aslPatches: _aslPatches,
        ...rest
    } = options;

    let result: MatnParseOptions = rest;

    // Migrate patternToOptions to slices (if not already present)
    if (!options.slices) {
        const legacyPatternOptions = patternToOptions as Record<string, LegacyPatternOptions> | undefined;
        const slicingOptions = migratePatternToOptions(legacyPatternOptions);
        if (slicingOptions) {
            result = { ...result, slices: slicingOptions };
        }
    } else {
        result = { ...result, slices: options.slices };
    }

    // Migrate excludePages/excludePagesWithPatterns to omit (if not already present)
    if (!options.omit) {
        const omit = migrateExcludePages(excludePages, excludePagesWithPatterns);
        if (omit) {
            result = { ...result, omit };
        }
    } else {
        result = { ...result, omit: options.omit };
    }

    // Migrate replacements to replace (if not already present)
    if (!options.replace) {
        const replace = migrateReplacements(replacements);
        if (replace) {
            result = { ...result, replace };
        }
    } else {
        result = { ...result, replace: options.replace };
    }

    return result;
};

/**
 * Legacy Excerpts format (v2.x) with Entry type
 */
type LegacyExcerpts = Omit<Excerpts, 'excerpts' | 'headings'> & { excerpts: Entry[]; headings: LegacyHeading[] };

/**
 * Legacy Heading format without AITranslation fields
 */
type LegacyHeading = {
    from: number;
    id: string;
    lastUpdatedAt?: number;
    nass: string;
    parent?: string;
    text?: string;
    translator: number;
};

/**
 * Migrates a legacy Entry to the new Excerpt format
 */
const migrateEntry = (entry: Entry): Excerpt => {
    return {
        from: entry.from,
        id: entry.id,
        lastUpdatedAt: entry.lastUpdatedAt! / 1000,
        nass: entry.arabic!,
        text: entry.translation!,
        to: entry.to,
        translator: entry.translator!,
        vol: entry.volume,
        vp: entry.pp, // Position/paragraph → volume page
    };
};

/**
 * Migrates a legacy Heading to the new Heading format with AITranslation
 */
const migrateHeading = (heading: LegacyHeading): Heading => {
    return {
        from: heading.from,
        id: heading.id,
        lastUpdatedAt: heading.lastUpdatedAt! / 1000,
        nass: heading.nass,
        parent: heading.parent,
        text: heading.text!,
        translator: heading.translator,
    };
};

/**
 * Migrates legacy Excerpts (v2.x) to the new format (v3.0)
 * Converts Entry[] to Excerpt[] and updates Heading format
 */
const migrateExcerpts = (data: LegacyExcerpts): Excerpts => {
    return {
        ...data,
        contractVersion: 'v3.0',
        excerpts: data.excerpts.map(migrateEntry),
        headings: data.headings.map(migrateHeading),
        lastUpdatedAt: Date.now(),
        options: migrateOptions(data.options),
    };
};

/**
 * Adapts incoming data to the latest format, migrating if necessary
 */
export const adaptExcerptsToLatest = (data: unknown): Excerpts => {
    const excerpts = data as Excerpts | LegacyExcerpts;

    if (!excerpts.contractVersion?.startsWith('v3.')) {
        return migrateExcerpts(excerpts as LegacyExcerpts);
    }

    return excerpts as Excerpts;
};
