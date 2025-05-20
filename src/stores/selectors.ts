import memoizeOne from 'memoize-one';

import type { Transcript, TranscriptStateCore } from './types';

const getParts = memoizeOne((transcripts: Record<string, any>) =>
    Object.keys(transcripts)
        .map((p) => parseInt(p, 10))
        .sort((a, b) => a - b),
);

const getSegments = memoizeOne((transcript?: Transcript) => transcript?.segments || []);

/**
 * Selects all transcript part numbers from state, sorted in ascending order.
 * @param state The transcript state
 * @returns Array of part numbers
 */
export const selectParts = (state: TranscriptStateCore): number[] => getParts(state.transcripts);

/**
 * Selects the currently active transcript based on selectedPart.
 * @param state The transcript state
 * @returns The current transcript or undefined if not found
 */
export const selectCurrentTranscript = (state: TranscriptStateCore) => state.transcripts[state.selectedPart];

/**
 * Selects segments from the currently active transcript.
 * @param state The transcript state
 * @returns Array of segments or empty array if no transcript is selected
 */
export const selectCurrentSegments = (state: TranscriptStateCore) => getSegments(selectCurrentTranscript(state));
