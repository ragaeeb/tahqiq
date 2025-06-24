export type Book = {
    contractVersion: string;
    createdAt: Date;
    groundTruthUrls?: string[];
    lastUpdatedAt: Date;
    pages: {
        id: number;
        text: string;
        volume: number;
    }[];
    urlTemplate?: string;
};

/**
 * Combined state and actions for manuscript management
 */
export type BookState = BookActions & BookStateCore;

/**
 * Core state properties for book compilation
 */
export type BookStateCore = {
    /** When the manuscript store was created */
    readonly createdAt: Date;
    /** Array of currently selected pages */
    readonly selectedPages: Page[];
    /** Currently selected manuscript volume number */
    readonly selectedVolume: number;
    readonly urlTemplate: string;

    /** Map of pages indexed by volume number */
    readonly volumeToPages: Record<number, Page[]>;
};

export type Page = {
    errorLines?: number[];
    id: number;
    /** Optional status indicating page processing state */
    status?: PageStatus;
    text: string;
};

/**
 * Possible status values for a manuscript page
 * - 'done': Page has been reviewed and completed
 * - 'review': Page needs review
 */
export type PageStatus = 'done' | 'review';

/**
 * Action functions available for transcript manipulation
 */
type BookActions = {
    init: (fileToBook: Record<string, Book>) => void;

    /**
     * Sets selection state for all pages
     * @param isSelected Whether to select or deselect all pages
     */
    selectAllPages: (isSelected: boolean) => void;

    setUrlTemplate: (template: string) => void;
};
