// ─────────────────────────────────────────────────────────────
// Pattern Types (mutually exclusive - only ONE per rule)
// ─────────────────────────────────────────────────────────────

/** Literal regex pattern - no token expansion */
type RegexPattern = { regex: string };

/** Template pattern - expands {{tokens}} before compiling to regex */
type TemplatePattern = { template: string };

/** Syntax sugar: ^(?:a|b|c) with token expansion */
type LineStartsWithPattern = { lineStartsWith: string[] };

/** Syntax sugar: (?:a|b|c)$ with token expansion */
type LineEndsWithPattern = { lineEndsWith: string[] };

type PatternType = RegexPattern | TemplatePattern | LineStartsWithPattern | LineEndsWithPattern;

// ─────────────────────────────────────────────────────────────
// Split Behavior
// ─────────────────────────────────────────────────────────────

type SplitBehavior = {
    /** Where to split relative to the match */
    split: 'before' | 'after';

    /**
     * Which occurrence(s) to split on.
     * - 'all': Split at every match (default)
     * - 'first': Only first match
     * - 'last': Only last match
     */
    occurrence?: 'first' | 'last' | 'all';

    /**
     * Maximum pages to span before forcing a split.
     * When set, occurrence filtering is applied per page-group.
     * - maxSpan: 1 = per-page (e.g., last punctuation on EACH page)
     * - maxSpan: 2 = at most 2 pages per segment
     * - undefined = no limit (entire content)
     */
    maxSpan?: number;
};

// ─────────────────────────────────────────────────────────────
// Constraints & Metadata
// ─────────────────────────────────────────────────────────────

type RuleConstraints = {
    /** Minimum page number for this rule to apply */
    min?: number;
    /** Maximum page number for this rule to apply */
    max?: number;
    /** Arbitrary metadata attached to segments matching this rule */
    meta?: Record<string, unknown>;
};

// ─────────────────────────────────────────────────────────────
// Combined Rule Type
// ─────────────────────────────────────────────────────────────

export type SplitRule = PatternType & SplitBehavior & RuleConstraints;

// ─────────────────────────────────────────────────────────────
// Input & Output
// ─────────────────────────────────────────────────────────────

/**
 * Input page structure
 */
export type PageInput = {
    /** Unique page/entry ID (used for maxSpan grouping). */
    id: number;
    /** Raw content (may contain HTML) */
    content: string;
};

/**
 * Segmentation options
 */
export type SegmentationOptions = {
    /** Rules applied in order - first matching rule wins for metadata */
    rules: SplitRule[];
    /** Strip HTML tags before matching (content will be plain text) */
    stripHtml?: boolean;
};

/**
 * Output segment
 */
export type Segment = {
    /** Segment content (plain text if stripHtml) */
    content: string;
    /** Original HTML (only if stripHtml was used) */
    html?: string;
    /** Starting page number */
    from: number;
    /** Ending page number (if spans multiple pages) */
    to?: number;
    /** Metadata from matched rule */
    meta?: Record<string, unknown>;
};
