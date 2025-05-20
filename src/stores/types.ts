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

export type JsonData = Record<string, Record<number | string, unknown> | unknown[]>;

export type Segment = ParagrafsSegment & {
    status?: string;
};

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
    deleteSelectedSegments: () => void;
    groupAndSliceSegments: () => void;
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
