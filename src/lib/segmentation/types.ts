/**
 * Input page structure (matches ShamelaPage essentials)
 */
export type PageInput = {
    /** Unique page ID */
    id: number;
    /** Raw content (may contain HTML) */
    content: string;
    /** Physical page number */
    page: number;
    /** Volume/part number */
    part: string;
};

/**
 * Template-based pattern: matches lines starting with specific text
 */
type TemplatePattern = {
    /** Lines starting with any of these strings match */
    lineStartsWith?: string[];
    /** Template string with {{tokens}} */
    template?: string;
};

/**
 * Regex-based pattern
 */
type RegexPattern = {
    /** Regex pattern string */
    regex: string;
};

/**
 * Pattern match type (one of template or regex)
 */
type Match = TemplatePattern | RegexPattern;

/**
 * Options for a slicing pattern
 */
export type SlicingOption = Match & {
    /** Optional metadata to attach to segments matching this pattern */
    meta?: { type?: 'chapter' | 'book' };
    /** Minimum page ID for this pattern to apply */
    min?: number;
    /** Maximum page ID for this pattern to apply */
    max?: number;
};

/**
 * Segmentation options
 */
export type SegmentationOptions = {
    /** Slice patterns to identify segment boundaries */
    slices?: SlicingOption[];
    /** Strip HTML tags before pattern matching. When true, content will be plain text and html will preserve original. */
    stripHtml?: boolean;
};

/**
 * Output segment
 */
export type Segment = {
    /** The segment content (plain text if stripHtml was used) */
    content: string;
    /** Original content with HTML preserved (only populated when stripHtml is true) */
    html?: string;
    /** Starting page ID */
    from: number;
    /** Ending page ID (if spans multiple pages) */
    to?: number;
    /** Optional metadata from matched pattern */
    meta?: { type?: 'chapter' | 'book' };
    /** Captured groups from regex pattern (only non-content groups) */
    captures?: string[];
};
