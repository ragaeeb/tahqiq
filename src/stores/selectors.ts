import memoizeOne from 'memoize-one';

import type { Segment, TranscriptStateCore } from './types';

const getParts = memoizeOne((transcripts: Record<string, any>) =>
    Object.keys(transcripts)
        .map((p) => parseInt(p, 10))
        .sort((a, b) => a - b),
);

export const getCurrentSegments = memoizeOne(
    (transcripts: Record<string, Segment[]>, selectedPart: number) => transcripts[selectedPart] ?? [],
);

export const selectParts = (state: TranscriptStateCore): number[] => getParts(state.transcripts);

export const selectCurrentSegments = (state: TranscriptStateCore): Segment[] => {
    return getCurrentSegments(state.transcripts, state.selectedPart);
};
