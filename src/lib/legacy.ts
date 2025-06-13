import { estimateSegmentFromToken } from 'paragrafs';

import type { Book, ManuscriptState } from '@/stores/manuscriptStore/types';
import type { Transcript, TranscriptSeries } from '@/stores/transcriptStore/types';

import type { PartsFormat, PartsWordsFormat, TranscriptSeriesV0 } from './legacyFormats';

import { BOOK_CONTRACT_LATEST, TRANSCRIPT_CONTRACT_LATEST } from './constants';
import { roundToDecimal } from './time';

export const adaptLegacyTranscripts = (input: any): TranscriptSeries => {
    if ((input as TranscriptSeries).contractVersion?.startsWith('v1.')) {
        const data = input as TranscriptSeries;

        return {
            ...data,
            transcripts: data.transcripts.map((t) => ({
                ...t,
                segments: t.segments.map((s) => ({
                    ...s,
                    tokens: s.tokens || estimateSegmentFromToken(s).tokens,
                })),
            })),
        };
    }

    if ((input as TranscriptSeriesV0).contractVersion?.startsWith('v0.')) {
        const data = input as TranscriptSeriesV0;

        return {
            contractVersion: TRANSCRIPT_CONTRACT_LATEST,
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

    if (((input as PartsWordsFormat).parts || [])[0]?.transcripts[0]) {
        const data = input as PartsWordsFormat;

        if (data.parts[0]?.transcripts[0]?.words) {
            return {
                contractVersion: TRANSCRIPT_CONTRACT_LATEST,
                createdAt: data.timestamp,
                lastUpdatedAt: data.timestamp,
                ...(data.postProcessingApp && { postProcessingApps: [data.postProcessingApp] }),
                transcripts: data.parts.map((part) => {
                    return {
                        segments: part.transcripts.map((s) => ({
                            end: s.end,
                            start: s.start,
                            text: s.body,
                            tokens: s.words!,
                        })),
                        timestamp: part.timestamp,
                        volume: part.part,
                        ...(part.urls && { urls: part.urls }),
                    };
                }),
            };
        }

        // the transcripts are very short 1-5s segments, almost tokens themselves
        return {
            contractVersion: TRANSCRIPT_CONTRACT_LATEST,
            createdAt: data.timestamp,
            lastUpdatedAt: data.timestamp,
            transcripts: data.parts.map((part) => {
                return {
                    segments: [
                        {
                            end: part.transcripts.at(-1)!.end,
                            start: part.transcripts[0]!.start,
                            text: part.transcripts.map((t) => t.body).join(' '),
                            tokens: part.transcripts.flatMap(
                                (s) => estimateSegmentFromToken({ end: s.end, start: s.start, text: s.body }).tokens,
                            ),
                        },
                    ],
                    timestamp: part.timestamp,
                    volume: part.part,
                    ...(part.urls && { urls: part.urls }),
                };
            }),
        };
    }

    if ((input as PartsFormat).parts) {
        const data = input as PartsFormat;

        return {
            contractVersion: TRANSCRIPT_CONTRACT_LATEST,
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
        contractVersion: TRANSCRIPT_CONTRACT_LATEST,
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

export const mapManuscriptToBook = (manuscriptState: ManuscriptState): Book => {
    return {
        contractVersion: BOOK_CONTRACT_LATEST,
        createdAt: manuscriptState.createdAt,
        lastUpdatedAt: new Date(),
        pages: Object.entries(manuscriptState.volumeToPages)
            .toSorted(([a], [b]) => Number(a) - Number(b))
            .flatMap(([volume, pages]) => {
                return pages.map((p) => ({ id: p.id, text: p.text, volume: Number(volume) }));
            }),
        ...(manuscriptState.urlTemplate && { urlTemplate: manuscriptState.urlTemplate }),
    };
};
