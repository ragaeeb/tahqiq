import type { Segment, Token } from 'paragrafs';

import type { PostProcessingApp } from '@/stores/transcriptStore/types';

export type BookTranscriptFormat = {
    pages: {
        body: string;
        part: number;
        words: Token[];
    }[];
    postProcessingApp: PostProcessingApp;
    timestamp: Date;
    urls: string[];
};

export type LegacySegment = {
    body: string;
    end: number;
    start: number;
    words?: Token[];
};

/**
 * Represents the legacy 'parts' format structure with transcripts divided into parts.
 */
export type PartsFormat = {
    parts: {
        part: number;
        timestamp: Date;
        transcripts: Segment[];
    }[];
    timestamp: Date;
    urls: string[];
};

export type PartsWordsFormat = {
    parts: {
        part: number;
        timestamp: Date;
        transcripts: LegacySegment[];
        urls?: string[];
    }[];
    postProcessingApp: PostProcessingApp;
    timestamp: Date;
    urls: string[];
};

/**
 * Represents the v0.x contract version structure with tokens instead of segments.
 */
export type TranscriptSeriesV0 = {
    contractVersion: string;
    createdAt: Date;
    lastUpdatedAt: Date;
    transcripts: { timestamp: Date; tokens: Token[]; urls?: string[]; volume: number }[];
};
