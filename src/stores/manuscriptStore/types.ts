import type { BoundingBox, Observation, TextBlock } from 'kokokor';

/**
 * Represents a Juz (section/part) format for Islamic texts.
 * This is a specialized format used for Quranic or Islamic scholarly works
 * that are traditionally divided into parts called "Juz" or "Para".
 */
export type Juz = {
    /** Version of the contract format used for this Juz */
    contractVersion: 'v2.0';
    /**
     * Collection of sheets (pages) that make up this Juz.
     * Each sheet contains the main text and optional footnotes.
     */
    sheets: Sheet[];
    /** When this Juz was created or last modified */
    timestamp: Date;
    /** Type identifier for this data structure */
    type: 'juz';
};

/**
 * Combined state and actions for manuscript management
 */
export type ManuscriptState = ManuscriptActions & ManuscriptStateCore;

/**
 * Core state properties for manuscript management
 */
export type ManuscriptStateCore = {
    idsFilter: Set<number>;
    isInitialized: boolean;
    sheets: Sheet[];
};

export type RawInputFiles = {
    'batch_output.json': Record<string, MacOCR>;
    'page_size.txt': string;
    'structures.json': { result: Record<string, StructureMetadata> };
    'surya.json': Record<string, SuryaPageOcrResult[]>;
};

export type Sheet = OcrData & {
    page: number;
};

export type SheetLine = TextLine & {
    alt: string;
    hasInvalidFootnotes?: boolean;
    includesHonorifics?: boolean;
    isSimilar?: boolean;
    page: number;
};

export type StructureMetadata = {
    readonly dpi: BoundingBox;
    readonly horizontal_lines?: BoundingBox[];
    readonly rectangles?: BoundingBox[];
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

export type TextLine = TextBlock & {
    id: number;
    lastUpdate: number;
};

export type TextLinePatch = Omit<Partial<TextLine>, 'id' | 'lastUpdate'>;

type AltText = {
    readonly id: number;
    text: string;
};

type MacOCR = { observations: Observation[] };

/**
 * Action functions available for transcript manipulation
 */
type ManuscriptActions = {
    applySupportToOriginal: (page: number, id: number) => void;

    autoCorrectFootnotes: (pages: number[]) => void;

    clearOutPages: (pages: number[]) => void;

    deleteLines: (ids: number[]) => void;

    deleteSupport: (page: number, id: number) => void;

    filterByIds: (ids: number[]) => void;

    filterByPages: (pages: number[]) => void;

    fixTypos: (ids: number[]) => void;

    /**
     * Initializes the store with manuscript data
     * @param data Object containing manuscript information
     */
    init: (fileNameToData: RawInputFiles) => void;

    initFromJuz: (juz: Juz) => void;

    mergeWithAbove: (page: number, id: number, mergeAsl?: boolean) => void;

    mergeWithBelow: (page: number, id: number, mergeAsl?: boolean) => void;

    replaceHonorifics: (ids: number[], from?: string, to?: string) => void;

    splitAltAtLineBreak: (page: number, id: number, alt: string) => void;

    updatePages: (pages: number[], diff: TextLinePatch, updateLastUpdated?: boolean) => void;

    updateTextLines: (ids: number[], diff: TextLinePatch, updateLastUpdated?: boolean) => void;
};

type OcrData = {
    /**
     * Matching observations extracted from surya for typo corrections.
     */
    readonly alt: AltText[];

    /**
     * Matching observations extracted from surya for typo corrections.
     */
    observations: TextLine[];
};
