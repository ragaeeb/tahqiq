export type Book = {
    contractVersion: string;
    createdAt: Date;
    index?: {
        level: number;
        page: number;
        title: string;
    }[];
    lastUpdatedAt: Date;
    pages: Page[];
    type: 'book';
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
    footnotes?: string;
    id: number;
    page?: number;
    status?: PageStatus;
    text: string;
    volume: number;
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
