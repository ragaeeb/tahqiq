import type { Juz, ManuscriptStateCore } from '@/stores/manuscriptStore/types';

import type { PostProcessingApp } from '../commonTypes';

/**
 * Represents a bookmark entry in the book's table of contents.
 * Used to mark important sections or chapters for quick navigation.
 */
export type Bookmark = {
    /** The page number where this bookmark points to */
    page: number;
    /** The display title or name of this bookmark */
    title: string;
    /** Optional volume number if the book spans multiple volumes */
    volume?: number;
};

/**
 * Combined state and actions for book management.
 * This type provides the complete interface for interacting with book data,
 * including both the current state and available operations.
 */
export type BookState = BookActions & BookStateCore;

/**
 * Core state properties for book compilation.
 * Contains the essential data structure for managing book content,
 * organized by volumes with pages and table of contents.
 */
export type BookStateCore = {
    /** Timestamp indicating when the book store was created */
    createdAt: Date;

    inputFileName?: string;

    readonly isHighlighterEnabled: boolean;

    postProcessingApps: PostProcessingApp[];

    /** Currently selected manuscript volume number for editing/viewing */
    readonly selectedVolume: number;

    /**
     * Mapping of volume numbers to their table of contents entries.
     * Each volume can have multiple index entries for navigation.
     */
    readonly volumeToIndex: Record<number, TableOfContents[]>;

    /**
     * Mapping of volume numbers to their constituent pages.
     * Each volume contains an array of pages with content and metadata.
     */
    readonly volumeToPages: Record<number, Page[]>;
};

/**
 * Represents a complete book (Kitab) in the standardized format.
 * This is the primary data structure used for storing and exchanging
 * complete book data with version control and metadata.
 */
export type Kitab = {
    /** Version of the contract format used for this book */
    contractVersion: string;
    /** When this book was initially created */
    createdAt: Date;
    /** Complete index/table of contents with bookmarks */
    index: Bookmark[];
    /** When this book was last updated */
    lastUpdatedAt: Date;
    /** All pages that comprise this book */
    pages: BookPage[];
    /** The apps that was used to edit this book */
    postProcessingApps?: PostProcessingApp[];
    /** Type identifier for this data structure */
    type: 'book';
};

/**
 * Represents a single page with additional metadata for internal management.
 * Extends BookPage with tracking information for change management.
 */
export type Page = BookPage & {
    /** Has a header */
    hasHeader?: boolean;
    /** Unique identifier for this page within the system */
    id: number;

    /** Timestamp of the last modification to this page */
    lastUpdate: number;
};

/**
 * Possible status values for a manuscript page.
 * Used to track the editorial state of each page in the workflow.
 */
export type PageStatus =
    /** Page has been reviewed and completed, ready for publication */
    | 'done'
    /** Page needs editorial review before completion */
    | 'review';

/**
 * Table of contents entry with internal tracking metadata.
 * Extends BookIndex with system-specific identification.
 */
export type TableOfContents = BookIndex & {
    /** Unique identifier for this table of contents entry */
    id: number;
};

/**
 * Action functions available for book manipulation.
 * These functions provide the core operations for managing book content,
 * including page management, initialization, and bulk operations.
 */
type BookActions = {
    /**
     * Removes multiple pages from the book by their IDs.
     * This operation is irreversible and will permanently delete the specified pages.
     *
     * @param pageIds - Array of page IDs to delete
     */
    deletePages: (pageIds: number[]) => void;

    /**
     * Initializes the book store from a collection of Juz files.
     * This is typically used when importing existing Juz data into the book format.
     *
     * @param fileToJuz - Mapping of file names to their corresponding Juz data
     */
    init: (fileToJuz: Record<string, Juz | Kitab>) => void;

    /**
     * Initializes the book store from existing manuscript data.
     * This converts manuscript format data into the book store structure.
     *
     * @param manuscript - The manuscript data to convert and import
     */
    initFromManuscript: (manuscript: ManuscriptStateCore) => void;

    /**
     * Merges the footnotes with the matn of the pages.
     * @param pageIds - Array of page IDs to merge.
     */
    mergeFootnotesWithMatn: (pageIds: number[]) => void;

    /**
     * Applies formatting on the selected pages from the book.
     * @param pageIds - Array of page IDs to reformat.
     */
    reformatPages: (pageIds: number[]) => void;

    /**
     * Shifts page or volume page numbers starting from a specific page.
     * This is useful for renumbering pages when inserting or removing content.
     *
     * @param startingPageId - The page ID to start shifting from
     * @param startingPageValue - The new value to start with
     * @param key - Which property to shift ('page' or 'volumePage')
     */
    shiftValues: (
        startingPageId: number,
        startingPageValue: number,
        key: keyof Pick<Page, 'page' | 'volumePage'>,
    ) => void;

    /**
     * Toggles whether the highlighting textareas are enabled.
     */
    toggleHighlighter: () => void;

    /**
     * Updates multiple pages with the same changes.
     * This is efficient for bulk operations like status changes or formatting updates.
     *
     * @param ids - Array of page IDs to update
     * @param diff - The changes to apply to each page
     * @param updateLastUpdated - Whether to update the lastUpdate timestamp (default: true)
     */
    updatePages: (ids: number[], diff: Omit<Partial<Page>, 'id' | 'lastUpdate'>, updateLastUpdated?: boolean) => void;
};

/**
 * Basic index entry for a book's table of contents.
 * Contains the minimal information needed to create navigation links.
 */
type BookIndex = {
    /** Page number where this index entry can be found */
    page: number;
    /** Title or heading text for this index entry */
    title: string;
};

/**
 * Represents a single page in a book with all its content and metadata.
 * This is the fundamental unit of content in the book system.
 */
type BookPage = {
    /** Optional footnotes or commentary for this page */
    footnotes?: string;
    /** Global page number across the entire work */
    page: number;
    /** Current editorial status of this page */
    status?: PageStatus;
    /** Main text content of this page */
    text: string;
    /** Volume number this page belongs to (for multi-volume works) */
    volume?: number;
    /** Page number within the specific volume */
    volumePage?: number;
};
