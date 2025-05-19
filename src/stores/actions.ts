import { replaceEnglishPunctuationWithArabic } from 'bitaboom';
import {
    createHints,
    mapSegmentsIntoFormattedSegments,
    markAndCombineSegments,
    mergeSegments,
    splitSegment,
} from 'paragrafs';

import type { Segment, Transcript, TranscriptSeries, TranscriptState } from './types';

import { selectCurrentSegments, selectCurrentTranscript } from './selectors';

export const groupAndSliceSegments = (state: TranscriptState) => {
    const { formatOptions: options } = state;
    const transcripts: Record<string, Transcript> = {};
    let idIndex = Date.now();

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
            id: idIndex++,
        }));

        transcripts[part] = { ...transcript, segments };
    });

    return {
        transcripts,
    };
};

export const mergeSelectedSegments = (state: TranscriptState) => {
    const currentSegments = selectCurrentSegments(state);
    const { selectedPart, selectedSegments, transcripts } = state;

    if (selectedSegments.length !== 2) {
        console.warn('MergeSegments: Exactly two segments must be selected for merging.');
        return {};
    }

    const [fromSegment, toSegment] = selectedSegments.toSorted((a, b) => a.start - b.start);
    const fromIndex = currentSegments.findIndex((segment) => segment.id === fromSegment!.id);
    const toIndex = currentSegments.findIndex((segment) => segment.id === toSegment!.id);

    const segmentsToMerge = currentSegments.slice(fromIndex, toIndex + 1);
    const mergedContent = mergeSegments(segmentsToMerge, '\n');

    const updatedSegmentsForPart = [
        ...currentSegments.slice(0, fromIndex),
        {
            ...mergedContent,
            id: Date.now(),
        },
        ...currentSegments.slice(toIndex + 1),
    ];

    return {
        selectedSegments: [],
        transcripts: {
            ...transcripts,
            [selectedPart]: { segments: updatedSegmentsForPart, volume: transcripts[selectedPart]!.volume },
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
                segments: transcript.segments.filter((segment) => !state.selectedSegments.includes(segment)),
                volume: transcript.volume,
            },
        },
    };
};

export const updateSegmentWithDiff = (
    { selectedPart, transcripts }: TranscriptState,
    diff: Partial<Segment> & { id: number },
) => {
    const segments = transcripts[selectedPart]!.segments.map((seg) => (seg.id === diff.id ? { ...seg, ...diff } : seg));

    return {
        transcripts: {
            ...transcripts,
            [selectedPart]: { segments, volume: transcripts[selectedPart]!.volume },
        },
    };
};

export const initStore = (data: TranscriptSeries) => {
    const result: Record<string, Transcript> = {};
    let idCounter = 0;

    for (const transcript of data.transcripts) {
        result[transcript.volume] = {
            segments: [
                {
                    end: transcript.tokens.at(-1)!.end,
                    id: idCounter++,
                    start: transcript.tokens[0]!.start,
                    text: transcript.tokens.map((t) => t.text).join(' '),
                    tokens: transcript.tokens,
                },
            ],
            volume: transcript.volume,
        };
    }

    return {
        isInitialized: true,
        selectedPart: data.transcripts[0]?.volume || 0,
        transcripts: result,
    };
};

export const splitSelectedSegment = (state: TranscriptState): Partial<TranscriptState> => {
    let segments = selectCurrentSegments(state);

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
        { ...first!, id: Date.now() },
        { ...second!, id: Date.now() + 1 },
        ...segments.slice(segmentIndex + 1),
    ];

    const transcript = state.transcripts[state.selectedPart]!;

    return {
        selectedToken: null,
        transcripts: {
            ...state.transcripts,
            [state.selectedPart]: { ...transcript, segments },
        },
    };
};
