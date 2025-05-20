import { replaceEnglishPunctuationWithArabic } from 'bitaboom';
import {
    createHints,
    mapSegmentsIntoFormattedSegments,
    markAndCombineSegments,
    mergeSegments,
    splitSegment,
} from 'paragrafs';

import type { Segment, SegmentStatus, Transcript, TranscriptSeries, TranscriptState } from './types';

import { selectCurrentSegments, selectCurrentTranscript } from './selectors';

const START_DIFF = 0.001; // hack to bust the key to re-render the textareas

export const groupAndSliceSegments = (state: TranscriptState) => {
    const { formatOptions: options } = state;
    const transcripts: Record<string, Transcript> = {};

    Object.entries(state.transcripts).forEach(([part, transcript]) => {
        let segments = transcript.segments.slice();

        if (options.flipPunctuation) {
            segments = segments.map((segment) => ({
                ...segment,
                text: replaceEnglishPunctuationWithArabic(segment.text),
                tokens: segment.tokens.map((t) => ({ ...t, text: replaceEnglishPunctuationWithArabic(t.text) })),
            }));
        }

        const fillers = options.fillers.flatMap((token) => [token, token + '.', token + '؟']);
        const marked = markAndCombineSegments(segments, {
            fillers,
            gapThreshold: options.silenceGapThreshold,
            hints: createHints(...options.hints),
            maxSecondsPerSegment: options.maxSecondsPerSegment,
            minWordsPerSegment: options.minWordsPerSegment,
        });

        segments = mapSegmentsIntoFormattedSegments(marked, options.maxSecondsPerLine).map((s) => ({
            ...s,
            start: s.start + START_DIFF,
        }));

        transcripts[part] = { ...transcript, segments };
    });

    return {
        transcripts,
    };
};

export const markSelectedDone = (state: TranscriptState) => {
    const transcript = selectCurrentTranscript(state)!;
    const { selectedSegments, transcripts } = state;

    const segments = transcript.segments.map((segment) => {
        if (selectedSegments.includes(segment)) {
            return { ...segment, status: 'done' as SegmentStatus };
        }

        return segment;
    });

    return { selectedSegments: [], transcripts: { ...transcripts, [transcript.volume]: { ...transcript, segments } } };
};

export const mergeSelectedSegments = (state: TranscriptState) => {
    const transcript = selectCurrentTranscript(state)!;
    const currentSegments = transcript.segments;
    const { selectedSegments, transcripts } = state;

    if (selectedSegments.length !== 2) {
        console.warn('MergeSegments: Exactly two segments must be selected for merging.');
        return {};
    }

    const [fromSegment, toSegment] = selectedSegments.toSorted((a, b) => a.start - b.start);
    const fromIndex = currentSegments.findIndex((segment) => segment.start === fromSegment!.start);
    const toIndex = currentSegments.findIndex((segment) => segment.start === toSegment!.start);

    const segmentsToMerge = currentSegments.slice(fromIndex, toIndex + 1);
    const mergedContent = mergeSegments(segmentsToMerge, '\n');

    const updatedSegmentsForPart = [
        ...currentSegments.slice(0, fromIndex),
        {
            ...mergedContent,
            start: mergedContent.start + START_DIFF,
        },
        ...currentSegments.slice(toIndex + 1),
    ];

    return {
        selectedSegments: [],
        transcripts: {
            ...transcripts,
            [transcript.volume]: {
                ...transcript,
                segments: updatedSegmentsForPart,
            },
        },
    };
};

export const selectAllSegments = (state: TranscriptState, isSelected: boolean) => {
    return { selectedSegments: isSelected ? selectCurrentSegments(state) : [] };
};

export const applySelection = (state: TranscriptState, segment: Segment, isSelected: boolean) => {
    return {
        selectedSegments: isSelected
            ? state.selectedSegments.concat(segment)
            : state.selectedSegments.filter((s) => segment !== s),
    };
};

export const removeSelectedSegments = (state: TranscriptState) => {
    const transcript = selectCurrentTranscript(state)!;
    return {
        selectedSegments: [],
        transcripts: {
            ...state.transcripts,
            [transcript.volume]: {
                ...transcript,
                segments: transcript.segments.filter((segment) => !state.selectedSegments.includes(segment)),
            },
        },
    };
};

export const updateSegmentWithDiff = (state: TranscriptState, segmentStart: number, diff: Partial<Segment>) => {
    const transcript = selectCurrentTranscript(state)!;
    const segments = transcript.segments.map((seg) => (seg.start === segmentStart ? { ...seg, ...diff } : seg));

    return {
        transcripts: {
            ...state.transcripts,
            [transcript.volume]: { ...transcript, segments },
        },
    };
};

export const initStore = (data: TranscriptSeries) => {
    const transcripts: Record<string, Transcript> = {};

    for (const transcript of data.transcripts) {
        transcripts[transcript.volume] = transcript;
    }

    return {
        createdAt: data.createdAt,
        selectedPart: data.transcripts[0]!.volume,
        transcripts,
    };
};

export const splitSelectedSegment = (state: TranscriptState) => {
    const transcript = selectCurrentTranscript(state)!;
    let segments = transcript.segments;

    if (!state.selectedToken) {
        console.warn('splitSelectedSegment: A token must be selected for splitting.');
        return {};
    }

    const segmentIndex = segments.findIndex(
        (segment) => state.selectedToken!.start >= segment.start && state.selectedToken!.end <= segment.end,
    );

    if (segmentIndex === -1) {
        console.warn('Segment not found for token');
        return {};
    }

    const [first, second] = splitSegment(segments[segmentIndex]!, state.selectedToken!.start);

    segments = [
        ...segments.slice(0, segmentIndex),
        { ...first!, start: first!.start + START_DIFF },
        { ...second!, start: second!.start + START_DIFF },
        ...segments.slice(segmentIndex + 1),
    ];

    return {
        selectedToken: null,
        transcripts: { ...state.transcripts, [transcript.volume]: { ...transcript, segments } },
    };
};
