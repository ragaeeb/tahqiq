import memoizeOne from 'memoize-one';
import { mergeSegments, type Segment as ParagrafsSegment, splitSegment, type Token } from 'paragrafs';
import { create } from 'zustand';

export type Segment = ParagrafsSegment & {
    readonly id: number;
    status?: 'done';
};

export type TranscriptState = TranscriptActions & TranscriptStateCore;

type TranscriptActions = {
    mergeSegments: () => void;
    setSelectedPart: (part: number) => void;
    setSelectedToken: (token: null | Token) => void;
    setTranscripts: (fileToTranscript: Record<string, ParagrafsSegment[]>) => void;
    splitSegment: () => void;
    toggleSegmentSelection: (segment: Segment, isSelected: boolean) => void;
    updateSegment: (update: Partial<Segment> & { id: number }) => void;
};

type TranscriptStateCore = {
    readonly isInitialized: boolean;
    readonly selectedPart: number;
    readonly selectedSegments: Segment[];
    readonly selectedToken: null | Token;
    readonly transcripts: Record<string, Segment[]>;
};

const getParts = memoizeOne((transcripts: Record<string, any>) =>
    Object.keys(transcripts)
        .map((p) => parseInt(p, 10))
        .sort((a, b) => a - b),
);

const getCurrentSegments = memoizeOne(
    (transcripts: Record<string, Segment[]>, selectedPart: number) => transcripts[selectedPart] ?? [],
);

export const selectParts = (state: TranscriptStateCore): number[] => getParts(state.transcripts);

export const selectCurrentSegments = (state: TranscriptStateCore): Segment[] => {
    return getCurrentSegments(state.transcripts, state.selectedPart);
};

export const useTranscriptStore = create<TranscriptState>((set) => ({
    isInitialized: false,
    mergeSegments: () => {
        set((state) => {
            const currentSegments = selectCurrentSegments(state);
            const { selectedPart, selectedSegments, transcripts } = state;

            if (selectedSegments.length !== 2) {
                console.warn('MergeSegments: Exactly two segments must be selected for merging.');
                return {}; // No change
            }

            const [fromSegment, toSegment] = selectedSegments.toSorted((a, b) => a.start - b.start);
            const fromIndex = currentSegments.findIndex((segment) => segment.id === fromSegment!.id);
            const toIndex = currentSegments.findIndex((segment) => segment.id === toSegment!.id);

            const segmentsToMerge = currentSegments.slice(fromIndex, toIndex + 1);
            const mergedContent = mergeSegments(segmentsToMerge, '\n'); // The '\n' is the joiner for text

            const newMergedSegment: Segment = {
                ...mergedContent, // Spread the text and tokens from mergeSegments result
                id: Date.now(), // New ID for the merged segment
            };

            const updatedSegmentsForPart = [
                ...currentSegments.slice(0, fromIndex),
                newMergedSegment,
                ...currentSegments.slice(toIndex + 1),
            ];

            return {
                selectedSegments: [],
                transcripts: {
                    ...transcripts,
                    [selectedPart]: updatedSegmentsForPart,
                },
            };
        });
    },
    selectedPart: 0, // Default to a sensible value
    selectedSegments: [],
    selectedToken: null,
    setSelectedPart: (part) =>
        set(() => {
            return { selectedPart: part, selectedSegments: [] };
        }),
    setSelectedToken: (token: null | Token) => set({ selectedToken: token }),

    setTranscripts: (fileToTranscript) =>
        set(() => {
            const transcripts: Record<string, Segment[]> = {};
            let idCounter = 0;

            const parts = Object.keys(fileToTranscript)
                .map((part) => parseInt(part))
                .sort((a, b) => a - b);

            for (const part of parts) {
                const segments: Segment[] = [];
                const paragrafSegments = fileToTranscript[part] as ParagrafsSegment[];

                for (const segment of paragrafSegments) {
                    segments.push({ ...segment, id: idCounter++ });
                }
                transcripts[part] = segments;
            }

            return {
                isInitialized: true,
                selectedPart: parts[0]!,
                selectedSegments: [],
                transcripts,
            };
        }),

    splitSegment: () => {
        return set((state) => {
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

            return { selectedToken: null, transcripts: { ...state.transcripts, [state.selectedPart]: segments } };
        });
    },

    toggleSegmentSelection: (segment, isSelected) =>
        set((state) => {
            return {
                selectedSegments: isSelected
                    ? state.selectedSegments.concat(segment)
                    : state.selectedSegments.filter((s) => segment !== s),
            };
        }),

    transcripts: {},

    updateSegment: (update) =>
        set((state) => {
            const { selectedPart, transcripts } = state;
            const segmentsForCurrentPart = transcripts[selectedPart] || [];

            const updatedSegments = segmentsForCurrentPart.map((seg) =>
                seg.id === update.id ? { ...seg, ...update } : seg,
            );

            return {
                transcripts: {
                    ...transcripts,
                    [selectedPart]: updatedSegments,
                },
            };
        }),
}));
