/**
 * Type definitions for Ketab store
 * Matches the ketab-online-sdk types structure
 */

/**
 * Reference to a book part or volume from the SDK
 */
export type PartReference = { id: number; name: string };

/**
 * Table of contents entry for a book (from SDK)
 */
export type IndexItem = {
    children?: IndexItem[];
    id: number;
    page: number;
    page_id: number;
    parent?: number;
    part_name: string;
    reciters?: any[];
    title: string;
    title_level: number;
};

/**
 * Individual page content in a book (from SDK)
 */
export type Page = {
    content: string;
    hadeeth?: any;
    id: number;
    index: number;
    page: number;
    part: null | PartReference;
    quran: any;
    reciters: any[];
    rowa: any[];
    seal: string;
    shrooh: any[];
};

/**
 * Complete book data including pages and metadata (from SDK)
 */
export type BookContents = {
    id: number;
    title: string;
    pages: Page[];
    index: IndexItem[];
    // Additional optional fields from the full type
    authors?: any[];
    categories?: any[];
    description?: string;
    [key: string]: any;
};

/**
 * Extended page type for the editor with parsed content
 */
export type KetabPage = Omit<Page, 'content'> & {
    /** The page body content (without footnotes) */
    body: string;
    /** Footnote content separated from body */
    footnote?: string;
    /** Timestamp when last updated */
    lastUpdatedAt?: number;
};

/**
 * Extended title type for the editor (flattened from IndexItem hierarchy)
 */
export type KetabTitle = IndexItem & {
    /** Timestamp when last updated */
    lastUpdatedAt?: number;
    /** Depth level for display indentation */
    depth: number;
};

/**
 * Re-export the BookContents type as KetabBook for consistency
 */
export type KetabBook = BookContents;

/**
 * Core state for Ketab editor
 */
export type KetabStateCore = {
    /** Book ID */
    bookId?: number;
    /** Book title */
    bookTitle?: string;
    /** Input filename */
    inputFileName?: string;
    /** Last update timestamp */
    lastUpdatedAt?: Date;
    /** All pages with parsed content */
    pages: KetabPage[];
    /** All titles/headings (flattened from index) */
    titles: KetabTitle[];
    /** Filtered page IDs (undefined = show all) */
    filteredPageIds?: number[];
    /** Filtered title IDs (undefined = show all) */
    filteredTitleIds?: number[];
};

/**
 * Actions available for Ketab editor
 */
export type KetabActions = {
    /**
     * Initializes the store from Ketab book data
     */
    init: (data: KetabBook, fileName?: string) => void;

    /**
     * Removes footnote references from page bodies and clears footnote content
     */
    removeFootnoteReferences: () => void;

    /**
     * Converts HTML content to plain text/markdown
     */
    convertToMarkdown: () => void;

    /**
     * Resets the store to initial empty state
     */
    reset: () => void;

    /**
     * Updates a single page
     */
    updatePage: (id: number, updates: Partial<Omit<KetabPage, 'id'>>) => void;

    /**
     * Updates a single title
     */
    updateTitle: (id: number, updates: Partial<Omit<KetabTitle, 'id'>>) => void;

    /**
     * Deletes a page by ID
     */
    deletePage: (id: number) => void;

    /**
     * Deletes a title by ID
     */
    deleteTitle: (id: number) => void;

    /**
     * Filters pages by IDs (undefined clears filter)
     */
    filterPagesByIds: (ids?: number[]) => void;

    /**
     * Filters titles by IDs (undefined clears filter)
     */
    filterTitlesByIds: (ids?: number[]) => void;
};

/**
 * Complete state including core data and actions
 */
export type KetabState = KetabActions & KetabStateCore;
