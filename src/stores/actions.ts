import { replaceEnglishPunctuationWithArabic } from 'bitaboom';
import {
    createHints,
    formatSegmentsToTimestampedTranscript,
    mapSegmentsIntoFormattedSegments,
    markAndCombineSegments,
    mergeSegments,
    splitSegment,
} from 'paragrafs';

import type { FormatOptions, RawTranscript, Segment, Transcript, TranscriptState } from './types';

import { selectCurrentSegments } from './selectors';

export const getMarkedSegments = (state: TranscriptState, options: FormatOptions) => {
    let segments = selectCurrentSegments(state);

    if (options.flipPunctuation) {
        segments = segments.map((segment) => ({
            ...segment,
            text: replaceEnglishPunctuationWithArabic(segment.text),
            tokens: segment.tokens.map((t) => ({ ...t, text: replaceEnglishPunctuationWithArabic(t.text) })),
        }));
    }

    const fillers = options.fillers.flatMap((token) => [token, token + '.', token + '؟']);
    return markAndCombineSegments(segments, {
        fillers,
        gapThreshold: options.silenceGapThreshold,
        hints: createHints(...options.hints),
        maxSecondsPerSegment: options.maxSecondsPerSegment,
        minWordsPerSegment: options.minWordsPerSegment,
    });
};

export const groupAndSliceSegments = (state: TranscriptState, options: FormatOptions) => {
    const combinedSegments = getMarkedSegments(state, options);

    const now = Date.now();
    const segments = mapSegmentsIntoFormattedSegments(combinedSegments, options.maxSecondsPerLine).map((s, i) => ({
        ...s,
        id: i + now,
    }));

    return {
        transcripts: {
            ...state.transcripts,
            [state.selectedPart]: {
                segments,
                text: formatSegmentsToTimestampedTranscript(combinedSegments, options.maxSecondsPerLine),
            },
        },
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
            [selectedPart]: { ...transcripts[selectedPart], segments: updatedSegmentsForPart },
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

export const updateSegmentWithDiff = (
    { selectedPart, transcripts }: TranscriptState,
    diff: Partial<Segment> & { id: number },
) => {
    const segments = transcripts[selectedPart]!.segments.map((seg) => (seg.id === diff.id ? { ...seg, ...diff } : seg));

    return {
        transcripts: {
            ...transcripts,
            [selectedPart]: { ...transcripts[selectedPart], segments },
        },
    };
};

export const mapFileToTranscript = (fileToTranscript: Record<string, RawTranscript>) => {
    const transcripts: Record<string, Transcript> = {};
    let idCounter = 0;

    const parts = Object.keys(fileToTranscript)
        .map((part) => parseInt(part))
        .sort((a, b) => a - b);

    for (const part of parts) {
        const segments: Segment[] = [];
        const paragrafSegments = fileToTranscript[part]!;

        for (const segment of paragrafSegments) {
            segments.push({ ...segment, id: idCounter++ });
        }
        transcripts[part] = { segments };
    }

    return {
        isInitialized: true,
        selectedPart: parts[0]!,
        selectedSegments: [],
        transcripts,
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
