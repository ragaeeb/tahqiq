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
 * Represents a heading/section marker
 */
export type Heading = {
    /** Starting page/reference */
    from: number;
    /** Unique identifier */
    id: string;
    /** Timestamp when last updated */
    lastUpdatedAt?: number;
    /** Arabic text */
    nass: string;
    /** Parent heading ID */
    parent?: number;
    /** English translation */
    text?: string;
    /** Translator identifier */
    translator?: number;
};

/**
 * Represents a footnote
 */
export type Footnote = {
    /** Starting page/reference */
    from: number;
    /** Unique identifier */
    id: string;
    /** Timestamp when last updated */
    lastUpdatedAt?: number;
    /** Arabic text */
    nass: string;
    /** English translation */
    text?: string;
    /** Translator identifier */
    translator?: number;
};

/**
 * Pattern matching options (excluding deprecated fields)
 */
export type PatternOptions = {
    /** Maximum page number to consider */
    maxPage?: number;
    /** Minimum page number to consider */
    minPage?: number;
    /** Type of entry to create */
    type?: number;
};

/**
 * Heading processing options
 */
export type HeadingOptions = {
    /** Preprocessing replacements before sending to prompt */
    preprompt?: Record<string, string>;
};

/**
 * Options for parsing matn text (excluding deprecated fields)
 */
export type MatnParseOptions = {
    /** Surgical patches for typos in the book */
    aslPatches?: Array<{ match: string; page: number; replacement: string }>;
    /** Filters out page ranges */
    excludePages?: string[];
    /** Removes pages matching any of these patterns */
    excludePagesWithPatterns?: string[];
    /** Should capture footnotes */
    footnotes?: boolean;
    /** Options for processing headings */
    headings?: HeadingOptions;
    /** Line separator (default: \\n) */
    lineSeparator?: string;
    /** Controls text overflow at page breaks */
    overflow?: 'next' | 'punctuation';
    /** Pattern to options mapping */
    patternToOptions?: Record<string, PatternOptions>;
    /** Preprocessing replacements */
    preprompt?: Record<string, string>;
    /** Marker pattern if previous entry matches */
    prevEntryMarkerPattern?: string;
    /** Preprocessing replacements */
    replacements?: Record<string, string>;
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
    createdAt?: number;
    /** All excerpt entries */
    excerpts: Entry[];
    /** All footnotes */
    footnotes: Footnote[];
    /** All headings/sections */
    headings: Heading[];
    /** Timestamp when last updated */
    lastUpdatedAt?: number;
    /** Parsing options used */
    options?: MatnParseOptions;
    /** Prompt sent to LLM for translation */
    prompt?: string;
};

/**
 * Core state for excerpts management
 */
export type ExcerptsStateCore = {
    /** Optional collection metadata */
    collection?: Collection;
    /** Contract version */
    contractVersion?: string;
    /** Creation timestamp */
    createdAt: Date;
    /** All excerpt entries */
    excerpts: Entry[];
    /** All footnotes */
    footnotes: Footnote[];
    /** All headings */
    headings: Heading[];
    /** Input filename */
    inputFileName?: string;
    /** Last update timestamp */
    lastUpdatedAt?: Date;
    /** Parsing options */
    options?: MatnParseOptions;
    /** Apps used for post-processing */
    postProcessingApps: PostProcessingApp[];
    /** Translation prompt */
    prompt?: string;
    /** Filtered excerpt IDs (undefined = show all) */
    filteredExcerptIds?: string[];
    /** Filtered heading IDs (undefined = show all) */
    filteredHeadingIds?: string[];
    /** Filtered footnote IDs (undefined = show all) */
    filteredFootnoteIds?: string[];
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
    updateExcerpt: (id: string, updates: Partial<Omit<Entry, 'id'>>) => void;

    /**
     * Creates a new excerpt from an existing one with selected Arabic text
     */
    createExcerptFromExisting: (sourceId: string, newArabicText: string) => void;

    /**
     * Updates a single footnote
     */
    updateFootnote: (id: string, updates: Partial<Omit<Footnote, 'id'>>) => void;

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
};

/**
 * Complete state including core data and actions
 */
export type ExcerptsState = ExcerptsActions & ExcerptsStateCore;
