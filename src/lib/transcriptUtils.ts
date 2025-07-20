import { createHints, formatSegmentsToTimestampedTranscript, markAndCombineSegments } from 'paragrafs';

import type { TranscriptStateCore } from '@/stores/transcriptStore/types';

import { selectCurrentTranscript } from '@/stores/transcriptStore/selectors';

export const generateFormattedTranscriptFromState = (state: TranscriptStateCore) => {
    const transcript = selectCurrentTranscript(state);
    const formatOptions = state.formatOptions;
    const markedSegments = markAndCombineSegments(transcript.segments, {
        fillers: formatOptions.fillers.flatMap((token) => [token, token + '.', token + '؟']),
        gapThreshold: formatOptions.silenceGapThreshold,
        hints: createHints(...formatOptions.hints),
        maxSecondsPerSegment: formatOptions.maxSecondsPerSegment,
        minWordsPerSegment: formatOptions.minWordsPerSegment,
    });
    const formatted = formatSegmentsToTimestampedTranscript(markedSegments, formatOptions.maxSecondsPerLine);

    return formatted.replace(/\n/g, '\n\n');
};
