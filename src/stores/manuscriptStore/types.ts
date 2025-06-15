import { type BoundingBox, type Observation, type SuryaPageOcrResult } from 'kokokor';

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

export type Sheet = OcrResult & {
    page: number;
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

    mergeWithAbove: (page: number, index: number) => void;

    splitAltAtLineBreak: (page: number, index: number, alt: string) => void;
};

type OcrResult = {
    /**
     * Matching observations extracted from surya for typo corrections.
     */
    readonly alternateObservations: Observation[];
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
     * Array of text observations extracted from the document.
     */
    readonly observations: Observation[];
    /**
     * Optional array of rectangle coordinates to process chapter titles.
     */
    readonly rectangles?: BoundingBox[];
};

type StructureMetadata = {
    readonly dpi: BoundingBox;
    readonly horizontal_lines?: BoundingBox[];
    readonly rectangles?: BoundingBox[];
};
