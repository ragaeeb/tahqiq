import { type Segment as ParagrafsSegment, type Token } from 'paragrafs';

export type FormatOptions = {
    fillers: string[];
    flipPunctuation: boolean;
    hints: string[];
    maxSecondsPerLine: number;
    maxSecondsPerSegment: number;
    minWordsPerSegment: number;
    silenceGapThreshold: number;
};

export type Segment = ParagrafsSegment & {
    status?: SegmentStatus;
};

export type SegmentStatus = 'done';

export type Transcript = {
    readonly segments: Segment[];
    readonly timestamp: Date;
    readonly urls?: string[];
    readonly volume: number;
};

export type TranscriptSeries = {
    contractVersion: 'v1.0';
    createdAt: Date;
    lastUpdatedAt: Date;
    transcripts: Transcript[];
};

export type TranscriptState = TranscriptActions & TranscriptStateCore;

export type TranscriptStateCore = {
    readonly createdAt: Date;
    readonly formatOptions: FormatOptions;
    readonly selectedPart: number;
    readonly selectedSegments: Segment[];
    readonly selectedToken: null | Token;
    readonly transcripts: Record<number, Transcript>;
};

type TranscriptActions = {
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
    markCompleted: () => void;
    mergeSegments: () => void;
    selectAllSegments: (isSelected: boolean) => void;
    setFormattingOptions: (options: FormatOptions) => void;
    setSelectedPart: (part: number) => void;
    setSelectedToken: (token: null | Token) => void;
    splitSegment: () => void;
    toggleSegmentSelection: (segment: Segment, isSelected: boolean) => void;
    updateSegment: (segmentStart: number, update: Partial<Segment>) => void;
};
