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
    readonly id: number;
    status?: 'done';
};

export type Transcript = {
    readonly segments: Segment[];
    readonly volume: number;
};

export type TranscriptSeries = {
    contractVersion: string;
    createdAt: Date;
    lastUpdatedAt: Date;
    transcripts: { timestamp: Date; tokens: Token[]; urls?: string[]; volume: number }[];
};

export type TranscriptState = TranscriptActions & TranscriptStateCore;

export type TranscriptStateCore = {
    readonly formatOptions: FormatOptions;
    readonly refreshToken: number;
    readonly selectedPart: number;
    readonly selectedSegments: Segment[];
    readonly selectedToken: null | Token;
    readonly transcripts: Record<number, Transcript>;
};

type TranscriptActions = {
    deleteSelectedSegments: () => void;
    groupAndSliceSegments: () => void;
    init: (data: TranscriptSeries) => void;
    mergeSegments: () => void;
    selectAllSegments: (isSelected: boolean) => void;
    setFormattingOptions: (options: FormatOptions) => void;
    setSelectedPart: (part: number) => void;
    setSelectedToken: (token: null | Token) => void;
    splitSegment: () => void;
    toggleSegmentSelection: (segment: Segment, isSelected: boolean) => void;
    updateSegment: (update: Partial<Segment> & { id: number }) => void;
};
