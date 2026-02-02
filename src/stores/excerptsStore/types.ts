import type { Segment } from 'flappa-doormal';
import type { Markers } from '@/lib/constants';
import type { BookSegmentationOptions } from '@/stores/segmentationStore/types';
import type { Prettify } from '@/types/utils';

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
export type ExcerptType = Markers.Book | Markers.Chapter;

type ExcerptMetadata = {
    /** Set if this is a title/heading of a book or chapter */
    type?: ExcerptType;

    num?: string;
};

export type IndexedExcerpt = Pick<Segment, 'from' | 'to'> & {
    /** The Arabic text of the excerpt */
    nass: string;

    meta?: ExcerptMetadata;

    /** Unique ID of this excerpt */
    id: string;
};

enum AITranslator {
    Gemini3 = 890,
    OpenAIGpt52Thinking = 893,
    OpenAIGpt5 = 879,
    Grok4Expert = 895,
}

type AITranslation = {
    /** The translated nass. */
    text: string;

    /** The AI model that translated it. */
    translator: AITranslator;

    /** The last time this translation was updated (Unix timestamp in seconds). */
    lastUpdatedAt: number;
};

export type Excerpt = Prettify<IndexedExcerpt & AITranslation>;

/**
 * Represents a heading/section marker
 */
export type IndexedHeading = Pick<IndexedExcerpt, 'nass' | 'from' | 'id'> & {
    /** Parent heading ID */
    parent?: string;
};

export type Heading = IndexedHeading & AITranslation;

type PostProcessingApp = { id: string; timestamp?: number; version: string };

/**
 * Complete excerpts data structure
 */
export type Compilation = {
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
    options: BookSegmentationOptions;

    postProcessingApps: PostProcessingApp[];

    /** The prompt used to translate the excerpts. */
    promptForTranslation?: string;

    /** The ID of the prompt template used. */
    promptId?: string;
};

/**
 * Core state for excerpts management
 */
export type ExcerptsStateCore = Compilation & {
    /** Input filename */
    inputFileName?: string;
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
    init: (data: Compilation, fileName?: string) => void;

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
     * Mark excerpts as sent to LLM for translation
     */
    markAsSentToLlm: (ids: string[]) => void;

    /**
     * Reset sent-to-LLM tracking to sync with current untranslated state
     */
    resetSentToLlm: () => void;

    /**
     * Saves the current state to OPFS storage.
     * @returns Promise resolving to true if successful, false otherwise
     */
    save: () => Promise<boolean>;

    /**
     * Updates the translation prompt and its ID
     */
    setPrompt: (promptId: string, content: string) => void;
};

/**
 * Complete state including core data and actions
 */
export type ExcerptsState = ExcerptsActions & ExcerptsStateCore;
