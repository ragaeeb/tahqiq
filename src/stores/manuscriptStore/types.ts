import type { BoundingBox, Observation, Size, TextBlock } from 'kokokor';

import type { LatestContractVersion } from '@/lib/constants';
import type { PostProcessingApp } from '@/stores/commonTypes';

/**
 * Represents a Juz (section/part) format for Islamic texts.
 * This is a specialized format used for Quranic or Islamic scholarly works
 * that are traditionally divided into parts called "Juz" or "Para".
 */
export type Juz = {
    /** Version of the contract format used for this Juz */
    contractVersion: typeof LatestContractVersion.Juz;
    postProcessingApps: PostProcessingApp[];
    /**
     * Collection of sheets (pages) that make up this Juz.
     * Each sheet contains the main text and optional footnotes.
     */
    sheets: Sheet[];
    /** When this Juz was created or last modified */
    timestamp: Date;

    /** Type identifier for this data structure */
    type: 'juz';

    /** URL to the PDF this was OCRed from. */
    url?: string;
};

/**
 * Combined state and actions for manuscript management
 */
export type ManuscriptState = ManuscriptActions & ManuscriptStateCore;

/**
 * Core state properties for manuscript management
 */
export type ManuscriptStateCore = {
    createdAt: Date;
    idsFilter: Set<number>;
    isInitialized: boolean;
    postProcessingApps: PostProcessingApp[];
    savedIds: number[];
    sheets: Sheet[];
    url: string;
};

export type Coordinates = { x: number; y: number };

export type StructurePage = {
    readonly page: number;
    readonly horizontal_lines?: BoundingBox[];
    readonly rectangles?: BoundingBox[];
};

type StructureMetadata = { readonly pages: StructurePage[]; readonly dpi: Coordinates };

export type RawInputFiles = {
    'mac.json': MacOCR;
    'structures.json': StructureMetadata;
    'surya.json': Record<string, SuryaPageOcrResult[]>;
};

export type Sheet = OcrData & { page: number };

export type SheetLine = TextLine & {
    alt: string;
    hasInvalidFootnotes?: boolean;
    includesHonorifics?: boolean;
    isSimilar?: boolean;
    page: number;
};

export type SuryaPageOcrResult = {
    /** The bbox for the image in (x1, y1, x2, y2) format. (x1, y1) is the top left corner, and (x2, y2) is the bottom right corner. All line bboxes will be contained within this bbox. */
    readonly image_bbox: [number, number, number, number];

    /** The page number in the file */
    readonly page: number;

    /** The detected text and bounding boxes for each line */
    readonly text_lines: {
        /** the axis-aligned rectangle for the text line in (x1, y1, x2, y2) format. (x1, y1) is the top left corner, and (x2, y2) is the bottom right corner. */
        readonly bbox: [number, number, number, number];

        /** the text in the line */
        readonly text: string;
    }[];
};

export type TextLine = TextBlock & { id: number; lastUpdate: number };

export type TextLinePatch = ((o: TextLine) => void) | Omit<Partial<TextLine>, 'id' | 'lastUpdate'>;

type ObservationPage = Size & { page: number; observations: Observation[] };

type MacOCR = { pages: ObservationPage[]; dpi: Coordinates };

/**
 * Action functions available for transcript manipulation
 */
type ManuscriptActions = {
    alignPoetry: (pages: number[]) => void;

    autoCorrectFootnotes: (pages: number[]) => void;

    clearOutPages: (pages: number[]) => void;

    deleteLines: (ids: number[]) => void;

    deleteSupport: (page: number, id: number) => void;

    deleteSupports: (ids: number[]) => void;

    expandFilteredRow: (id: number) => void;

    filterByIds: (ids: number[]) => void;

    filterByPages: (pages: number[]) => void;

    filterBySimilar: (ids: number[], threshold: number) => void;

    fixTypos: (ids: number[]) => void;

    /**
     * Initializes the store with manuscript data
     * @param data Object containing manuscript information
     */
    init: (fileNameToData: RawInputFiles) => void;

    initFromJuz: (juz: Juz) => void;

    merge: (page: number, ids: number[]) => void;

    mergeWithAbove: (page: number, id: number, mergeAsl?: boolean) => void;

    mergeWithBelow: (page: number, id: number, mergeAsl?: boolean) => void;

    reset: () => void;

    saveId: (id: number) => void;

    searchAndReplace: (pattern: RegExp | string, replacement: string) => void;

    setUrl: (url: string) => void;

    splitAltAtLineBreak: (page: number, id: number, alt: string) => void;

    /**
     * Shifts page numbers starting from a specific page.
     * This is useful for renumbering pages.
     *
     * @param startingPage - The page ID to start shifting from
     * @param startingPageValue - The new value to start with
     * @param cascadeBelow If this is true, we will update the pages after this one accordingly.
     */
    updatePageNumber: (startingPage: number, startingPageValue: number, cascadeBelow?: boolean) => void;

    updatePages: (pages: number[], diff: TextLinePatch, updateLastUpdated?: boolean) => void;

    updateTextLines: (ids: number[], diff: TextLinePatch, updateLastUpdated?: boolean) => void;
};

type OcrData = {
    /**
     * Matching observations extracted from surya for typo corrections.
     */
    alt: string[];

    /**
     * Matching observations extracted from surya for typo corrections.
     */
    observations: TextLine[];
};
