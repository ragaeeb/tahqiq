/**
 * Type definitions for Web store
 * Handles Islamic content scraped from scholar websites
 */

/**
 * Raw page from the input JSON (scraped web content)
 */
export type WebPageInput = {
    accessed?: string;
    body: string;
    footnote?: string;
    page: number;
    title?: string;
    url?: string;
};

/**
 * Scraping engine metadata
 */
export type ScrapingEngine = { name: string; version: string };

/**
 * Input data structure from JSON file
 */
export type WebBook = {
    pages: WebPageInput[];
    scrapingEngine?: ScrapingEngine;
    timestamp?: string;
    urlPattern?: string;
};

/**
 * Extended page type for the editor with parsed content
 */
export type WebPage = {
    /** Timestamp when the page was accessed during scraping */
    accessed?: string;
    /** The page body content */
    body: string;
    /** Footnote content */
    footnote?: string;
    /** Unique page identifier (from page field) */
    id: number;
    /** Timestamp when last updated in editor */
    lastUpdatedAt?: number;
    /** Page title if available */
    title?: string;
    /** Original URL if available */
    url?: string;
};

/**
 * Title type for the editor (derived from page titles)
 */
export type WebTitle = {
    /** Title content */
    content: string;
    /** Unique title identifier (same as page id) */
    id: number;
    /** Timestamp when last updated */
    lastUpdatedAt?: number;
    /** Page this title belongs to */
    page: number;
};

/**
 * Core state for Web editor
 */
export type WebStateCore = {
    /** Filtered page IDs (undefined = show all) */
    filteredPageIds?: number[];
    /** Filtered title IDs (undefined = show all) */
    filteredTitleIds?: number[];
    /** Input filename */
    inputFileName?: string;
    /** Last update timestamp */
    lastUpdatedAt?: Date;
    /** All pages with parsed content */
    pages: WebPage[];
    /** Scraping engine info */
    scrapingEngine?: ScrapingEngine;
    /** All titles derived from page titles */
    titles: WebTitle[];
    /** URL pattern for generating external links */
    urlPattern?: string;
};

/**
 * Actions available for Web editor
 */
export type WebActions = {
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

    /**
     * Initializes the store from Web book data
     */
    init: (data: WebBook, fileName?: string) => void;

    /**
     * Removes footnote content from all pages
     */
    removeFootnotes: () => void;

    /**
     * Resets the store to initial empty state
     */
    reset: () => void;

    /**
     * Updates a single page
     */
    updatePage: (id: number, updates: Partial<Omit<WebPage, 'id'>>) => void;

    /**
     * Updates a single title
     */
    updateTitle: (id: number, updates: Partial<Omit<WebTitle, 'id'>>) => void;

    /**
     * Applies a formatting function to all page bodies in bulk
     */
    applyBodyFormatting: (formatFn: (text: string) => string) => void;
};

/**
 * Complete state including core data and actions
 */
export type WebState = WebActions & WebStateCore;
