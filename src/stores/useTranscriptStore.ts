import { mergeSegments, type Segment as ParagrafsSegment, type Token } from 'paragrafs';
import { create } from 'zustand';

export type Segment = ParagrafsSegment & {
    readonly id: number;
    status?: 'done';
};

type TranscriptState = {
    isInitialized: boolean;
    mergeSegments: () => void;
    parts: number[];
    selectedPart: number;
    selectedSegments: Segment[];
    selectedToken: null | Token;
    setSelectedPart: (part: number) => void;
    setSelectedToken: (token: null | Token) => void;
    setTranscripts: (fileToTranscript: Record<string, ParagrafsSegment[]>) => void;
    toggleSegmentSelection: (segment: Segment, selected: boolean) => void;
    transcripts: Record<string, Segment[]>;
    updateSegment: (update: Partial<Segment> & { id: number }) => void;
};

export const useTranscriptStore = create<TranscriptState>((set) => ({
    isInitialized: false,
    mergeSegments: () => {
        set((state) => {
            const [from, to] = state.selectedSegments;
            const segments = state.transcripts[state.selectedPart]!;
            const fromIndex = segments.findIndex((segment) => segment === from);
            const toIndex = segments.findIndex((segment) => segment === to);
            const merged = mergeSegments(segments.slice(fromIndex, toIndex + 1), '\n');

            return {
                selectedSegments: [],
                transcripts: {
                    ...state.transcripts,
                    [state.selectedPart]: [...segments.slice(0, fromIndex), merged, ...segments.slice(toIndex)],
                },
            };
        });
    },
    parts: [],
    selectedPart: 0,
    selectedSegments: [],
    selectedToken: null,
    setSelectedPart: (part) => set({ selectedPart: part, selectedSegments: [] }),
    setSelectedToken: (token: null | Token) => set({ selectedToken: token }),
    setTranscripts: (fileToTranscript) =>
        set(() => {
            const parts = Object.keys(fileToTranscript)
                .map((part) => parseInt(part))
                .sort();
            const transcripts: Record<string, Segment[]> = {};
            let id = 0;

            for (const part of parts) {
                const segments: Segment[] = [];
                const paragrafSegments = fileToTranscript[part] as ParagrafsSegment[];

                for (const segment of paragrafSegments) {
                    segments.push({ ...segment, id: id++ });
                }

                transcripts[part] = segments;
            }

            return { isInitialized: true, parts, selectedPart: parts[0]!, transcripts };
        }),
    toggleSegmentSelection: (segment, selected) =>
        set((state) => {
            return {
                selectedSegments: selected
                    ? state.selectedSegments.concat(segment)
                    : state.selectedSegments.filter((s) => segment !== s),
            };
        }),
    transcripts: {},
    updateSegment: (upd) =>
        set((state) => {
            const list = state.transcripts[state.selectedPart] || [];
            const updated = list.map((seg) => (seg.id === upd.id ? { ...seg, ...upd } : seg));
            return {
                transcripts: { ...state.transcripts, [state.selectedPart]: updated },
            };
        }),
}));
