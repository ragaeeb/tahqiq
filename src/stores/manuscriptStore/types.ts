import type { BoundingBox, Observation, SuryaPageOcrResult } from 'kokokor';

/**
 * Combined state and actions for manuscript management
 */
export type ManuscriptState = ManuscriptActions & ManuscriptStateCore;

/**
 * Core state properties for manuscript management
 */
export type ManuscriptStateCore = {
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
    isSimilar?: boolean;
    page: number;
};

export type StructureMetadata = {
    readonly dpi: BoundingBox;
    readonly horizontal_lines?: BoundingBox[];
    readonly rectangles?: BoundingBox[];
};

export type TextLine = Observation & {
    hasInvalidFootnotes?: boolean;
    id: number;
    includesHonorifics?: boolean;
    isMerged?: boolean;
};

type AltText = {
    readonly id: number;
    readonly text: string;
};

type MacOCR = { observations: Observation[] };

/**
 * Action functions available for transcript manipulation
 */
type ManuscriptActions = {
    /**
     * Initializes the store with manuscript data
     * @param data Object containing manuscript information
     */
    init: (fileNameToData: RawInputFiles) => void;

    mergeWithAbove: (page: number, id: number) => void;

    splitAltAtLineBreak: (page: number, index: number, alt: string) => void;
};

type OcrData = {
    /**
     * Matching observations extracted from surya for typo corrections.
     */
    readonly alt: AltText[];
    /**
     * The dimensions and DPI information of the document.
     */
    readonly dpi: BoundingBox;
    /**
     * Optional array of horizontal lines detected in the document.
     * Often used for identifying page breaks, section separators, or footers.
     */
    readonly horizontalLines?: BoundingBox[];
    /**
     * Matching observations extracted from surya for typo corrections.
     */
    readonly observations: TextLine[];

    /**
     * Optional array of rectangle coordinates to process chapter titles.
     */
    readonly rectangles?: BoundingBox[];
};
