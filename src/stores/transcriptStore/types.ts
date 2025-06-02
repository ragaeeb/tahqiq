import { type Segment as ParagrafsSegment, type Token } from 'paragrafs';

/**
 * Configuration options for formatting transcript segments
 */
export type FormatOptions = {
    /** List of filler words to be identified in the transcript */
    fillers: string[];
    /** Whether to convert English punctuation to Arabic punctuation */
    flipPunctuation: boolean;
    /** List of hint phrases to identify section boundaries */
    hints: string[];
    /** Maximum duration in seconds for each line within a segment */
    maxSecondsPerLine: number;
    /** Maximum duration in seconds for a complete segment */
    maxSecondsPerSegment: number;
    /** Minimum number of words required for a segment */
    minWordsPerSegment: number;
    /** Threshold in seconds for identifying silence gaps between segments */
    silenceGapThreshold: number;
};

export type PostProcessingApp = {
    id: string;
    timestamp?: Date;
    version: string;
};

/**
 * Extends the base ParagrafsSegment with additional status information
 */
export type Segment = ParagrafsSegment & {
    /** Optional status indicating segment processing state */
    status?: SegmentStatus;
};

/**
 * Possible status values for a transcript segment
 * - 'done': Segment has been reviewed and completed
 */
export type SegmentStatus = 'done';

/**
 * Represents a single transcript volume with its segments
 */
export type Transcript = {
    /** Array of transcript segments with timing and text content */
    readonly segments: Segment[];
    /** Timestamp when this transcript was created */
    readonly timestamp: Date;
    /** Optional array of source URLs for the transcript audio */
    readonly urls?: string[];
    /** Numeric identifier for this transcript volume */
    readonly volume: number;
};

/**
 * Collection of related transcripts with version and timing information
 */
export type TranscriptSeries = {
    /** Version of the contract format used for this transcript series */
    contractVersion: 'v1.0';

    /** When this transcript series was initially created */
    createdAt: Date;

    /** When this transcript series was last modified */
    lastUpdatedAt: Date;

    /** The apps that was used to edit this transcript */
    postProcessingApps?: PostProcessingApp[];

    /** Array of transcript volumes in this series */
    transcripts: Transcript[];
};

/**
 * Combined state and actions for transcript management
 */
export type TranscriptState = TranscriptActions & TranscriptStateCore;

/**
 * Core state properties for transcript management
 */
export type TranscriptStateCore = {
    /** When the transcript store was created */
    readonly createdAt: Date;
    /** Current formatting options for displaying and processing transcripts */
    readonly formatOptions: FormatOptions;
    /** Currently selected transcript volume number */
    readonly selectedPart: number;
    /** Array of currently selected segments */
    readonly selectedSegments: Segment[];
    /** Currently selected token for operations like splitting, or null if none selected */
    readonly selectedToken: null | Token;
    /** Map of transcript volumes indexed by volume number */
    readonly transcripts: Record<number, Transcript>;
};

/**
 * Action functions available for transcript manipulation
 */
type TranscriptActions = {
    addTranscripts: (files: FileList) => void;

    /**
     * Removes all currently selected segments from the transcript
     */
    deleteSelectedSegments: () => void;

    /**
     * Groups and slices transcript segments based on current formatting options
     */
    groupAndSliceSegments: () => void;

    /**
     * Initializes the store with transcript data
     * @param data Object containing transcript information
     */
    init: (data: TranscriptSeries) => void;

    /**
     * Marks all selected segments as completed
     */
    markCompleted: () => void;

    /**
     * Merges selected segments into a single segment
     */
    mergeSegments: () => void;

    /**
     * Merges all the tokens from various segments into a single segment.
     */
    rebuildSegmentFromTokens: () => void;

    /**
     * Sets selection state for all segments
     * @param isSelected Whether to select or deselect all segments
     */
    selectAllSegments: (isSelected: boolean) => void;

    /**
     * Updates formatting options for the transcript
     * @param options New formatting options to apply
     */
    setFormattingOptions: (options: FormatOptions) => void;

    /**
     * Changes the currently selected transcript volume
     * @param part Volume number to select
     */
    setSelectedPart: (part: number) => void;

    /**
     * Sets the currently selected token for operations like splitting
     * @param token Token to select, or null to clear selection
     */
    setSelectedToken: (token: null | Token) => void;

    /**
     * Splits a segment at the position of the currently selected token
     */
    splitSegment: () => void;

    /**
     * Toggles selection state for a specific segment
     * @param segment Segment to toggle selection for
     * @param isSelected Whether to select or deselect the segment
     */
    toggleSegmentSelection: (segment: Segment, isSelected: boolean) => void;

    /**
     * Updates properties of a specific segment
     * @param segmentStart Start time of the segment to update
     * @param update Partial segment object with properties to update
     */
    updateSegment: (segmentStart: number, update: Partial<Segment>) => void;

    /**
     * Updates the urls property for this current transcript.
     * @param urls The set of urls used.
     */
    updateUrlsForTranscript: (urls: string[]) => void;
};
