import { type BoundingBox, type Observation, type OcrResult, type SuryaPageOcrResult } from 'kokokor';

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
};

type StructureMetadata = {
    readonly dpi: BoundingBox;
    readonly horizontal_lines?: BoundingBox[];
    readonly rectangles?: BoundingBox[];
};
