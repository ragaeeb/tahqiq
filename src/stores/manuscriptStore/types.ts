/**
 * Combined state and actions for transcript management
 */
export type ManuscriptState = ManuscriptActions & ManuscriptStateCore;

/**
 * Core state properties for transcript management
 */
export type ManuscriptStateCore = {
    /** When the transcript store was created */
    readonly createdAt: Date;
    /** Array of currently selected segments */
    readonly selectedPages: Page[];
    /** Currently selected transcript volume number */
    readonly selectedVolume: number;
    /** Map of pages indexed by volume number */
    readonly volumeToPages: Record<number, Page[]>;
};

export type Page = {
    id: number;
    text: string;
};

export type RawManuscript = {
    contractVersion: string;
    createdAt: Date;
    data: {
        blocks: TextBlock[];
        page: number;
    }[];
    lastUpdatedAt: Date;
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
