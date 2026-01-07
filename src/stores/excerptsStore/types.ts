import type { SegmentationOptions } from 'flappa-doormal';
import type { PostProcessingApp } from '../commonTypes';

/**
 * Represents a foreign ID with associated volume information
 */
export type ForeignId = {
    /** The foreign identifier (e.g., YouTube video ID) */
    id: string;
    /** Volume number associated with this ID */
    volume: number;
};

/**
 * Represents a collection with metadata and foreign ID references
 */
export type Collection = {
    /** Optional array of foreign ID references */
    fid?: ForeignId[];
    /** Unique identifier for the collection */
    id: string;
    /** Optional library identifier */
    library?: number;
    /** Display title of the collection */
    title: string;
};

/**
 * Entry type enum values
 */
export type EntryType = number;

/**
 * Entry flags for marking special properties
 */
export type EntryFlags = number;

/**
 * Represents a single excerpt entry
 */
export type Entry = {
    /** Arabic text content */
    arabic?: string;
    /** Reference to collection by number */
    collection: number;
    /** Commentary on this entry */
    commentary?: string;
    /** Array of entry IDs that this entry explains */
    explains?: string[];
    /** Entry flags */
    flags?: EntryFlags;
    /** Starting page number */
    from: number;
    /** Unique identifier for the entry */
    id: string;
    /** Index number within the collection */
    index?: number;
    /** Timestamp when last updated */
    lastUpdatedAt?: number;
    /** Position/paragraph number */
    pp: number;
    /** Ending page number */
    to?: number;
    /** English/translated text */
    translation?: string;
    /** Translator identifier */
    translator?: number;
    /** Type of entry */
    type?: EntryType;
    /** Optional URL reference */
    url?: string;
    /** Volume number */
    volume: number;
};

/**
 * Set if this is a title/heading of a book or chapter
 */
export type ExcerptType = 'book' | 'chapter';

type ExcerptMetadata = {
    /** Set if this is a title/heading of a book or chapter */
    type?: ExcerptType;

    num?: string;
};

type RawExcerpt = {
    /** The Arabic text of the excerpt */
    nass: string;

    /** The page number in the book that this text was extracted from. */
    from: number;

    meta?: ExcerptMetadata;

    /** The page number in the book that this text spans until (if different from the starting page) */
    to?: number;
};

export type IndexedExcerpt = RawExcerpt & {
    /** Unique ID of this excerpt */
    id: string;

    /** Volume number for this page */
    vol: number;

    /** The page in the volume (ie: this value would be 55 if the excerpt is from page 55 in the 7th volume). This is useful for citations. */
    vp: number;
};

enum AITranslator {
    ClaudeSonnet45 = 891,
    Gemini3 = 890,
    OpenAIGpt51Thinking = 889,
    OpenAIGpt5 = 879,
    Grok41ThinkingBeta = 892,
}

type AITranslation = {
    /** The translated nass. */
    text: string;

    /** The AI model that translated it. */
    translator: AITranslator;

    /** The last time this translation was updated (Unix timestamp in seconds). */
    lastUpdatedAt: number;
};

export type Excerpt = IndexedExcerpt & AITranslation;

/**
 * Represents a heading/section marker
 */
export type IndexedHeading = Pick<RawExcerpt, 'nass' | 'from'> & {
    /** Unique identifier */
    id: string;

    /** Parent heading ID */
    parent?: string;
};

export type Heading = IndexedHeading & AITranslation;

/**
 * Pattern matching options (excluding deprecated fields)
 */
export type PatternOptions = {
    /** Maximum page number to consider */
    maxPage?: number;
    /** Minimum page number to consider */
    minPage?: number;
    /** Type of entry to create */
    type?: ExcerptType;
};

/**
 * Heading processing options
 */
export type HeadingOptions = {
    /** Preprocessing replacements before sending to prompt */
    preprompt?: Record<string, string>;
};

type TemplatePattern = { lineStartsWith?: string[] } | { template: string };

type RegexPattern = { regex: string };

type Match = TemplatePattern | RegexPattern;

type SlicingOption = Match & { meta?: any; min?: number; max?: number };

type OmitPageByPattern = { regex: string };

/**
 * Omit pages starting from the "from" page number until the "to". If "to" is omitted, then we will omit all pages starting from the "from" until the end of the book.
 */
type OmitPageByRange = { from: number; to?: number };

type OmitPageNumbers = { pages: number[] };

type OmitPagesOption = OmitPageByPattern | OmitPageByRange | OmitPageNumbers;

type Replacements = { from: Match; to: string; page?: number };

/**
 * Legacy/deprecated options for parsing matn text (v2.x and earlier)
 * These fields are automatically migrated to their v3.0 equivalents
 */
export type LegacyMatnParseOptions = {
    /** Surgical patches for typos in the book.
     * @deprecated since v3.0, use replace
     */
    aslPatches?: Array<{ match: string; page: number; replacement: string }>;
    /** Filters out page ranges
     *
     * @deprecated since v3.0, use omit
     */
    excludePages?: string[];
    /** Removes pages matching any of these patterns
     *
     * @deprecated since v3.0, use omit
     */
    excludePagesWithPatterns?: string[];
    /** Pattern to options mapping.
     * @deprecated since v3.0, use slices
     */
    patternToOptions?: Record<string, PatternOptions>;
    /** Preprocessing replacements
     *
     * @deprecated since v3.0, use replace
     */
    replacements?: Record<string, string>;
};

/**
 * Options for parsing matn text (v3.0+)
 */
export type MatnParseOptions = {
    /** Should capture footnotes */
    footnotes?: boolean;
    /** Options for processing headings */
    headings?: HeadingOptions;
    /** Line separator (default: \\n) */
    lineSeparator?: string;
    /** Controls text overflow at page breaks */
    overflow?: 'next' | 'punctuation';
    /** Preprocessing replacements */
    preprompt?: Record<string, string>;
    /** Marker pattern if previous entry matches */
    prevEntryMarkerPattern?: string;

    /**
     * @since v3.0
     */
    replace?: Replacements[];

    /**
     * @since v3.0
     */
    omit?: OmitPagesOption[];

    /**
     * @since v3.0
     */
    slices?: SlicingOption[];
};

/**
 * Complete excerpts data structure
 */
export type Excerpts = {
    /** Optional collection metadata */
    collection?: Collection;
    /** Contract version for format compatibility */
    contractVersion: string;
    /** Timestamp when created */
    createdAt: number;
    /** All excerpt entries */
    excerpts: Excerpt[];
    /** All footnotes */
    footnotes: Excerpt[];
    /** All headings/sections */
    headings: Heading[];
    /** Timestamp when last updated */
    lastUpdatedAt: number;
    /** Parsing options used */
    options: SegmentationOptions;

    /** The prompt used to translate the excerpts. */
    promptForTranslation: string;
};

/**
 * Core state for excerpts management
 */
export type ExcerptsStateCore = {
    /** Optional collection metadata */
    collection?: Collection;
    /** Contract version */
    contractVersion: string;
    /** Creation timestamp */
    createdAt: Date;
    /** All excerpt entries */
    excerpts: Excerpt[];
    /** All footnotes */
    footnotes: Excerpt[];
    /** All headings */
    headings: Heading[];
    /** Input filename */
    inputFileName?: string;
    /** Last update timestamp */
    lastUpdatedAt: Date;
    /** Parsing options */
    options: SegmentationOptions;
    /** Apps used for post-processing */
    postProcessingApps: PostProcessingApp[];
    /** The prompt used to translate the excerpts */
    promptForTranslation: string;
    /** Filtered excerpt IDs (undefined = show all) */
    filteredExcerptIds?: string[];
    /** Filtered heading IDs (undefined = show all) */
    filteredHeadingIds?: string[];
    /** Filtered footnote IDs (undefined = show all) */
    filteredFootnoteIds?: string[];
    /** IDs of excerpts that have been sent to LLM for translation */
    sentToLlmIds: Set<string>;
};

/**
 * Actions available for excerpts management
 */
export type ExcerptsActions = {
    /**
     * Deletes multiple excerpts by ID
     */
    deleteExcerpts: (ids: string[]) => void;

    /**
     * Deletes multiple footnotes by ID
     */
    deleteFootnotes: (ids: string[]) => void;

    /**
     * Deletes multiple headings by ID
     */
    deleteHeadings: (ids: string[]) => void;

    /**
     * Initializes the store from Excerpts data
     */
    init: (data: Excerpts, fileName?: string) => void;

    /**
     * Resets the store to initial empty state
     */
    reset: () => void;

    /**
     * Updates a single excerpt
     */
    updateExcerpt: (id: string, updates: Partial<Omit<Excerpt, 'id'>>) => void;

    /**
     * Creates a new excerpt from an existing one with selected Arabic text
     */
    createExcerptFromExisting: (sourceId: string, newArabicText: string) => void;

    /**
     * Updates a single footnote
     */
    updateFootnote: (id: string, updates: Partial<Omit<Excerpt, 'id'>>) => void;

    /**
     * Updates a single heading
     */
    updateHeading: (id: string, updates: Partial<Omit<Heading, 'id'>>) => void;

    /**
     * Applies a formatting function to all excerpt translations in bulk
     */
    applyTranslationFormatting: (formatFn: (text: string) => string) => void;

    /**
     * Applies a formatting function to all heading translations in bulk
     */
    applyHeadingFormatting: (formatFn: (text: string) => string) => void;

    /**
     * Applies a formatting function to all footnote translations in bulk
     */
    applyFootnoteFormatting: (formatFn: (text: string) => string) => void;

    /**
     * Applies a formatting function to all excerpt nass (Arabic) in bulk
     */
    applyExcerptNassFormatting: (formatFn: (nass: string) => string) => void;

    /**
     * Applies a formatting function to all heading nass (Arabic) in bulk
     */
    applyHeadingNassFormatting: (formatFn: (nass: string) => string) => void;

    /**
     * Applies a formatting function to all footnote nass (Arabic) in bulk
     */
    applyFootnoteNassFormatting: (formatFn: (nass: string) => string) => void;

    /**
     * Filters excerpts by IDs (undefined clears filter)
     */
    filterExcerptsByIds: (ids?: string[]) => void;

    /**
     * Filters headings by IDs (undefined clears filter)
     */
    filterHeadingsByIds: (ids?: string[]) => void;

    /**
     * Filters footnotes by IDs (undefined clears filter)
     */
    filterFootnotesByIds: (ids?: string[]) => void;

    /**
     * Applies bulk translations to excerpts, headings, and footnotes efficiently
     * @returns Result with count of updated items and total translations
     */
    applyBulkTranslations: (
        translationMap: Map<string, string>,
        translator: number,
    ) => { updated: number; total: number };

    /**
     * Merges multiple adjacent excerpts into one.
     * The first excerpt becomes the merged result with concatenated nass/text.
     * @param ids - IDs of adjacent excerpts to merge (in order)
     * @returns true if merge was successful
     */
    mergeExcerpts: (ids: string[]) => boolean;

    /**
     * Merges adjacent short excerpts that have the same `from` and `to` values.
     * Uses SHORT_SEGMENT_WORD_THRESHOLD (30 words) as the minimum word count.
     * @returns Number of excerpts merged (removed)
     */
    mergeShortExcerpts: () => number;

    /**
     * Mark excerpts as sent to LLM for translation
     */
    markAsSentToLlm: (ids: string[]) => void;

    /**
     * Reset sent-to-LLM tracking to sync with current untranslated state
     */
    resetSentToLlm: () => void;
};

/**
 * Complete state including core data and actions
 */
export type ExcerptsState = ExcerptsActions & ExcerptsStateCore;
