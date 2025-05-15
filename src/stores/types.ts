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

export type RawTranscript = ParagrafsSegment[];

export type Segment = ParagrafsSegment & {
    readonly id: number;
    status?: 'done';
};

export type TranscriptState = TranscriptActions & TranscriptStateCore;

export type TranscriptStateCore = {
    readonly isInitialized: boolean;
    readonly selectedPart: number;
    readonly selectedSegments: Segment[];
    readonly selectedToken: null | Token;
    readonly transcripts: Record<string, Segment[]>;
};

type TranscriptActions = {
    groupAndSliceSegments: (options: FormatOptions) => void;
    mergeSegments: () => void;
    selectAllSegments: (isSelected: boolean) => void;
    setSelectedPart: (part: number) => void;
    setSelectedToken: (token: null | Token) => void;
    setTranscripts: (fileToTranscript: Record<string, RawTranscript>) => void;
    splitSegment: () => void;
    toggleSegmentSelection: (segment: Segment, isSelected: boolean) => void;
    updateSegment: (update: Partial<Segment> & { id: number }) => void;
};
