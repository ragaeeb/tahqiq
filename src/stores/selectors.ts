import memoizeOne from 'memoize-one';

import type { Transcript, TranscriptStateCore } from './types';

const getParts = memoizeOne((transcripts: Record<string, any>) =>
    Object.keys(transcripts)
        .map((p) => parseInt(p, 10))
        .sort((a, b) => a - b),
);

const getSegments = memoizeOne((transcript?: Transcript) => transcript?.segments || []);

export const selectParts = (state: TranscriptStateCore): number[] => getParts(state.transcripts);

export const selectCurrentTranscript = (state: TranscriptStateCore) => state.transcripts[state.selectedPart];

export const selectCurrentSegments = (state: TranscriptStateCore) => getSegments(selectCurrentTranscript(state));
