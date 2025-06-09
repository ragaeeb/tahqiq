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
export type ManuscriptState = ManuscriptActions & ManuscriptStateCore;

/**
 * Core state properties for manuscript management
 */
export type ManuscriptStateCore = {
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

export type RawManuscript = {
    contractVersion: string;
    createdAt: Date;
    data: {
        blocks: TextBlock[];
        page: number;
    }[];
};

/**
 * Action functions available for transcript manipulation
 */
type ManuscriptActions = {
    /**
     * Initializes the store with manuscript data
     * @param data Object containing manuscript information
     */
    init: (data: RawManuscript) => void;

    /**
     * Sets selection state for all pages
     * @param isSelected Whether to select or deselect all pages
     */
    selectAllPages: (isSelected: boolean) => void;

    setUrlTemplate: (template: string) => void;
};

type TextBlock = {
    /** If the text is centered on the page. This is true if there is at least some padding around the text and it does not span up to the margins. */
    readonly isCentered?: boolean;
    /** If any of the observations in this block had a typo that was automatically patched, this will be set to true */
    readonly isEdited?: boolean;
    /** If this text is a footnote. This is generally associated with texts appearing below the last horizontal line. */
    readonly isFootnote?: boolean;
    /** If the text represents a heading. This is generally associated with texts that are surrounded in rectangles. */
    readonly isHeading?: boolean;
    /** The text associated with this text block */
    readonly text: string;
};
