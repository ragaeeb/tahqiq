import type { Compilation, Excerpt } from '@/stores/excerptsStore/types';

export const CAPTURE_CONTINUOUS_PAGES = 'trailing' as const;

export const SANITIZE_HTML = 'html' as const;

export type SanitizeGroups = typeof SANITIZE_HTML;

export type PatternOptions = { minPage?: number; maxPage?: number; type?: number };

export type HeadingOptions = {
    /**
     * Preprocessing replacements to make before sending to prompt.
     * @since contractVersion v1.2
     */
    preprompt?: Record<string, string>;
};

export type LegacyMatnParseOptions = {
    /**
     * How should indexed entries be parsed dashed: (8 - abcd), an Arabic abbreviation followed by a number, or in square brackets [2] Abcd
     * @deprecated since contractVersion v1.2 just use patternToOptions and do post-processing.
     */
    numeralStrategy?: 'dashed' | 'letter' | 'square';

    /**
     * Marks the very first page from which entry indexes should be considered to be added. Otherwise we will just assume they are part of the paragraph text.
     * @since contractVersion v1.1
     * @deprecated since contractVersion v1.2 Use
     */
    firstPageWithIndex?: number;

    /**
     * Should flatten all html tags.
     * @deprecated As of contractVersion v1.1, use sanitize = ['html'] */
    flatten?: boolean;

    /**
     * If this is truthy we will capture footnotes.
     * @since contractVersion v1.2
     */
    footnotes?: boolean;

    /**
     * Options for processing headings.
     * @since contractVersion v1.2
     */
    headings?: HeadingOptions;

    /**
     * Surgical patches for the book which has typos.
     * @since contractVersion v1.2
     */
    aslPatches?: Array<{ page: number; match: string; replacement: string }>;

    /**
     * Removes all pages that matches this pattern.
     * @since contractVersion v1.2
     * @deprecated since contractVersion v2.0, use excludePagesWithPatterns
     */
    removePagesWithPattern?: string;

    /**
     * Removes all pages that match any of these patterns, it'll be concatenated using a | in the final Regex.
     * @since contractVersion v1.2
     */
    excludePagesWithPatterns?: string[];

    /**
     * Filters out these page ranges.
     * @since contractVersion v1.2
     */
    excludePages?: string[];

    /**
     * @deprecated As of contractVersion v1.1, use newChapterMarkerPattern = '^باب'
     * If there are no html tags around a line that starts with باب should we treat it as a chapter or not */
    shouldCapturePlainTextChapters?: boolean;

    /** If a chapter has <span id='toc-23'>3 - ChapterName</span> should we turn the chapter into a numbered list item */
    parseNumericChapters?: boolean;

    /**
     * Does text span from one page to another
     * @deprecated as of v2.0, use overflow.
     */
    pageSpanning?: typeof CAPTURE_CONTINUOUS_PAGES | 'true';

    /**
     * Controls how text overflow is handled at page breaks.
     * - `punctuation`: Cut off text at the last punctuation mark
     * - `next`: Continue text until the next pattern marker.
     * @since v2.0
     */
    overflow?: 'punctuation' | 'next';

    /** A regular expression pattern to mark the start of a new entry.
     * @deprecated As of contractVersion v1.1 Use typeToMarkerPatterns
     */
    newEntryMarkerPattern?: string;

    /**
     * Marker patterns to match a text along with the type of entry to create it as.
     * @since contractVersion v1.1
     * @deprecated since contractVersion v1.2, use patternToOptions instead.
     */
    patternToType?: Record<string, number>;

    /**
     * @since contractVersion v1.2
     */
    patternToOptions?: Record<string, PatternOptions>;

    /**
     * A regular expression pattern to mark the start of a new entry iff the last entry's matn matches this pattern.
     * @since contractVersion v1.1
     */
    prevEntryMarkerPattern?: string;

    /**
     * If there are no any text that starts with # should we parse them as chapters */
    isMarkdown?: boolean;

    /**
     * Should we automatically attempt to fix out of order numerals indexes.
     * @deprecated since contractVersion v2.0, this is now done in a post-processing step.
     */
    fix?: 'indexes';

    /**
     * Regular expression patterns to remove from the text before processing.
     *
     * @deprecated since contractVersion v1.2 Use replacements.
     */
    sanitize?: Array<string | SanitizeGroups>;

    /**
     * Preprocessing replacements to make.
     * @since contractVersion 1.2
     */
    replacements?: Record<string, string>;

    /**
     * Preprocessing replacements to make before sending to prompt.
     * @since contractVersion v1.2
     */
    preprompt?: Record<string, string>;

    /** If this book has repeating numerals such that a numeral is not unique.
     * @deprecated since contractVersion v1.2
     */
    hasDuplicateNumerals?: boolean;

    /**
     * Should we capture comma separated numerals (ie: 3,4,5 - Abcd) for manual post-processing.
     * @deprecated since contractVersion v1.2, use patternToOptions
     */
    captureCommaSeparatedIndices?: boolean;

    /** The delimeter to put between lines. By default it is a line break character \n. */
    lineSeparator?: string;
};

export type LegacyExcerpt = Pick<Excerpt, 'from' | 'lastUpdatedAt' | 'to' | 'translator' | 'id'> & {
    type: number;
    translation: string;
    arabic: string;
};

export type LegacyCompilation = Pick<
    Compilation,
    'collection' | 'contractVersion' | 'createdAt' | 'footnotes' | 'lastUpdatedAt' | 'headings'
> & { options: LegacyMatnParseOptions; excerpts: LegacyExcerpt[] };
