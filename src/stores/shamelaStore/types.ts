import type { BookData, Page as ShamelaPageBase, Title as ShamelaTitleBase } from 'shamela';

/**
 * Extended page type for the editor with parsed content
 */
export type ShamelaPage = ShamelaPageBase & {
    /** The page body content (without footnotes) */
    body: string;
    /** Footnote content separated from body */
    footnote?: string;
    /** Timestamp when last updated */
    lastUpdatedAt?: number;
};

/**
 * Extended title type for the editor
 */
export type ShamelaTitle = ShamelaTitleBase & {
    /** Timestamp when last updated */
    lastUpdatedAt?: number;
};

/**
 * Re-export the BookData type as ShamelaBook for consistency
 */
export type ShamelaBook = BookData & {
    /** Major release version */
    majorRelease: number;
    /** Shamela book ID for linking to shamela.ws */
    shamelaId?: number;
};

/**
 * Core state for Shamela editor
 */
export type ShamelaStateCore = {
    /** Major release version */
    majorRelease: number;
    /** All pages with parsed content */
    pages: ShamelaPage[];
    /** Shamela book ID for linking to shamela.ws */
    shamelaId?: number;
    /** All titles/headings */
    titles: ShamelaTitle[];
    /** Input filename */
    inputFileName?: string;
    /** Last update timestamp */
    lastUpdatedAt?: Date;
    /** Filtered page IDs (undefined = show all) */
    filteredPageIds?: number[];
    /** Filtered title IDs (undefined = show all) */
    filteredTitleIds?: number[];
};

/**
 * Actions available for Shamela editor
 */
export type ShamelaActions = {
    /**
     * Initializes the store from Shamela book data
     */
    init: (data: ShamelaBook, fileName?: string) => void;

    /**
     * Removes Arabic numeric page markers from all page content
     */
    removePageMarkers: () => void;

    /**
     * Resets the store to initial empty state
     */
    reset: () => void;

    /**
     * Updates a single page
     */
    updatePage: (id: number, updates: Partial<Omit<ShamelaPage, 'id'>>) => void;

    /**
     * Updates a single title
     */
    updateTitle: (id: number, updates: Partial<Omit<ShamelaTitle, 'id'>>) => void;

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
export type ShamelaState = ShamelaActions & ShamelaStateCore;

// Re-export base types for external use
export type { ShamelaPageBase, ShamelaTitleBase };
