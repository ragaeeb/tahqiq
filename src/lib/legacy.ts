import type { Segment, Token } from 'paragrafs';

import type { Transcript, TranscriptSeries } from '@/stores/types';

import { CONTRACT_LATEST } from './constants';
import { roundToDecimal } from './time';

/**
 * Represents the legacy 'parts' format structure with transcripts divided into parts.
 */
type PartsFormat = {
    parts: {
        part: number;
        timestamp: Date;
        transcripts: Segment[];
    }[];
    timestamp: Date;
    urls: string[];
};

/**
 * Represents the v0.x contract version structure with tokens instead of segments.
 */
type TranscriptSeriesV0 = {
    contractVersion: string;
    createdAt: Date;
    lastUpdatedAt: Date;
    transcripts: { timestamp: Date; tokens: Token[]; urls?: string[]; volume: number }[];
};

export const adaptLegacyTranscripts = (input: any): TranscriptSeries => {
    if ((input as TranscriptSeries).contractVersion?.startsWith('v1.')) {
        return input;
    }

    if ((input as TranscriptSeriesV0).contractVersion?.startsWith('v0.')) {
        const data = input as TranscriptSeriesV0;

        return {
            contractVersion: CONTRACT_LATEST,
            createdAt: data.createdAt,
            lastUpdatedAt: data.lastUpdatedAt,
            transcripts: data.transcripts.map((t) => ({
                ...((t.urls?.length || 0) > 0 && { urls: t.urls }),
                segments: [
                    {
                        end: t.tokens.at(-1)!.end,
                        start: t.tokens[0]!.start,
                        text: t.tokens.map((t) => t.text).join(' '),
                        tokens: t.tokens,
                    },
                ],
                timestamp: t.timestamp,
                volume: t.volume,
            })),
        };
    }

    if ((input as PartsFormat).parts) {
        const data = input as PartsFormat;

        return {
            contractVersion: CONTRACT_LATEST,
            createdAt: data.timestamp,
            lastUpdatedAt: data.timestamp,
            transcripts: data.parts.map((part) => {
                return {
                    segments: [
                        {
                            end: part.transcripts.at(-1)!.end,
                            start: part.transcripts[0]!.start,
                            text: part.transcripts.map((t) => t.text).join(' '),
                            tokens: part.transcripts.flatMap((s) => s.tokens),
                        },
                    ],
                    timestamp: part.timestamp,
                    volume: part.part,
                };
            }),
        };
    }

    throw new Error(`Unrecognized transcript format: ${JSON.stringify(input).substring(0, 100)}...`);
};

export const mapTranscriptsToLatestContract = (transcripts: Transcript[], createdAt: Date): TranscriptSeries => {
    return {
        contractVersion: CONTRACT_LATEST,
        createdAt,
        lastUpdatedAt: new Date(),
        transcripts: Object.values(transcripts)
            .toSorted((a, b) => a.volume - b.volume)
            .map((t) => ({
                ...t,
                segments: t.segments.map((s) => ({ ...s, end: roundToDecimal(s.end), start: roundToDecimal(s.start) })),
            })),
    };
};
