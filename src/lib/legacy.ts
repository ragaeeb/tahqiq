import type { Segment } from 'paragrafs';

import type { TranscriptSeries } from '@/stores/types';

type PartsFormat = {
    parts: {
        part: number;
        timestamp: Date;
        transcripts: Segment[];
    }[];
    timestamp: Date;
    urls: string[];
};

export const adaptLegacyTranscripts = (input: any): TranscriptSeries => {
    if ((input as TranscriptSeries).contractVersion?.startsWith('v0.')) {
        return input;
    }

    if ((input as PartsFormat).parts) {
        const data = input as PartsFormat;

        return {
            contractVersion: 'v0.1',
            createdAt: data.timestamp,
            lastUpdatedAt: data.timestamp,
            transcripts: data.parts.map((part) => {
                return {
                    timestamp: part.timestamp,
                    tokens: part.transcripts.flatMap((s) => s.tokens),
                    volume: part.part,
                };
            }),
        };
    }

    throw new Error('Unrecognized transcript format');
};
