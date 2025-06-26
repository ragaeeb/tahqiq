import type { ManuscriptStateCore } from '../manuscriptStore/types';

export type Bookmark = {
    page: number;
    title: string;
    volume?: number;
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

    /** Currently selected manuscript volume number */
    readonly selectedVolume: number;

    readonly volumeToIndex: Record<number, TableOfContents[]>;

    /** Map of pages indexed by volume number */
    readonly volumeToPages: Record<number, Page[]>;
};

export type Juz = {
    contractVersion: 'v1.0';
    index: BookIndex[];
    sheets: {
        footnotes?: string;
        page: number;
        text: string;
    }[];
    timestamp: Date;
    type: 'juz';
};

export type Kitab = {
    contractVersion: string;
    createdAt: Date;
    index: Bookmark[];
    lastUpdatedAt: Date;
    pages: BookPage[];
    type: 'book';
};

export type Page = BookPage & {
    id: number;
    lastUpdate: number;
};

/**
 * Possible status values for a manuscript page
 * - 'done': Page has been reviewed and completed
 * - 'review': Page needs review
 */
export type PageStatus = 'done' | 'review';

export type TableOfContents = BookIndex & {
    id: number;
};

/**
 * Action functions available for transcript manipulation
 */
type BookActions = {
    deletePages: (pageIds: number[]) => void;
    init: (fileToJuz: Record<string, Juz>) => void;

    initFromManuscript: (manuscript: ManuscriptStateCore) => void;

    shiftValues: (
        startingPageId: number,
        startingPageValue: number,
        key: keyof Pick<Page, 'page' | 'volumePage'>,
    ) => void;

    updatePages: (ids: number[], diff: Omit<Partial<Page>, 'id' | 'lastUpdate'>, updateLastUpdated?: boolean) => void;
};

type BookIndex = {
    page: number;
    title: string;
};

type BookPage = {
    footnotes?: string;
    page: number;
    status?: PageStatus;
    text: string;
    volume?: number;
    volumePage?: number;
};
