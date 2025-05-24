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

/**
 * Processes transcript segments based on format options
 * Applies Arabic punctuation if enabled and groups segments according to configured thresholds
 * Adds a small time offset to ensure unique keys for rendering
 *
 * @param state - Current transcript state containing segments and format options
 * @returns Object with updated transcripts incorporating formatted segments
 */
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

export const addTranscriptsFromFiles = async (state: TranscriptState, files: FileList) => {
    const jsonPromises = Array.from(files)
        .filter((f) => f.name.endsWith('.json'))
        .map(async (file) => {
            return JSON.parse(await file.text()) as Transcript;
        });

    const transcripts: Record<number, Transcript> = (await Promise.all(jsonPromises)).reduce(
        (acc, t) => ({ ...acc, [t.volume]: t }),
        {},
    );

    return { selectedPart: Object.keys(transcripts)[0]!, transcripts: { ...state.transcripts, ...transcripts } };
};

/**
 * Marks all currently selected segments as 'done' in the transcript
 * Updates segment status while preserving other segment properties
 * Clears the selection after marking
 *
 * @param state - Current transcript state containing segments and selection info
 * @returns Object with cleared selection and updated transcript segments
 */
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

/**
 * Merges two selected segments into a single segment
 * Combines all segments between the earliest and latest selected segments
 * Clears the selection after merging
 * Requires exactly two segments to be selected
 *
 * @param state - Current transcript state containing segments and selection info
 * @returns Object with cleared selection and updated transcript segments, or empty object if conditions not met
 */
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

/**
 * Selects all segments in the current transcript or clears selection
 *
 * @param state - Current transcript state
 * @param isSelected - Boolean indicating whether to select all or clear selection
 * @returns Object with updated selection state
 */
export const selectAllSegments = (state: TranscriptState, isSelected: boolean) => {
    return { selectedSegments: isSelected ? selectCurrentSegments(state) : [] };
};

/**
 * Updates the selection state for a specific segment
 * Either adds the segment to selection or removes it based on isSelected parameter
 *
 * @param state - Current transcript state
 * @param segment - The segment to update selection status for
 * @param isSelected - Boolean indicating whether to select or deselect the segment
 * @returns Object with updated selection array
 */
export const applySelection = (state: TranscriptState, segment: Segment, isSelected: boolean) => {
    return {
        selectedSegments: isSelected
            ? state.selectedSegments.concat(segment)
            : state.selectedSegments.filter((s) => segment !== s),
    };
};

export const rebuildSegmentFromTokens = (state: TranscriptState) => {
    const transcript = selectCurrentTranscript(state)!;
    const tokens = transcript.segments.flatMap((s) => s.tokens);

    return {
        transcripts: {
            ...state.transcripts,
            [transcript.volume]: {
                ...transcript,
                segments: [
                    {
                        end: tokens.at(-1)!.end,
                        start: tokens[0]!.start + START_DIFF,
                        text: tokens.map((token) => token.text).join(' '),
                        tokens,
                    },
                ],
            },
        },
    };
};

/**
 * Updates the urls property of the current transcript.
 *
 * @param state - Current transcript state
 * @param urls - The urls that were used for the ground truth of this transcript.
 * @returns Object with updated url for this transcript.
 */
export const setUrlsForTranscript = (state: TranscriptState, urls: string[]) => {
    const transcript = selectCurrentTranscript(state)!;

    return {
        transcripts: {
            ...state.transcripts,
            [transcript.volume]: {
                ...transcript,
                urls,
            },
        },
    };
};

/**
 * Removes all currently selected segments from the transcript
 * Filters out selected segments from the transcript and clears selection
 *
 * @param state - Current transcript state containing segments and selection info
 * @returns Object with cleared selection and filtered transcript segments
 */
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

/**
 * Updates a specific segment with partial changes
 * Identifies segment by its start time and applies provided diff object
 *
 * @param state - Current transcript state
 * @param segmentStart - Start time of the segment to update
 * @param diff - Partial segment object containing properties to update
 * @returns Object with updated transcript segments
 */
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

/**
 * Initializes the transcript store with provided data
 * Organizes transcripts by volume for easier access
 *
 * @param data - Transcript series data containing transcript information
 * @returns Initial state object for the transcript store
 */
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

/**
 * Splits a segment at the position of the currently selected token
 * Creates two separate segments from the original segment
 * Adds a small time offset to ensure unique keys for rendering
 * Requires a token to be selected within a valid segment
 *
 * @param state - Current transcript state with selected token information
 * @returns Object with updated transcript segments and cleared token selection, or empty object if conditions not met
 */
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
