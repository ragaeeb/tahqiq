import { mergeSegments, type Segment as ParagrafsSegment, type Token } from 'paragrafs';
import { create } from 'zustand';

export type Segment = ParagrafsSegment & {
    readonly id: number;
    status?: 'done';
};

export type TranscriptState = {
    readonly isInitialized: boolean;
    mergeSegments: () => void;
    readonly parts: number[];
    readonly segments: Segment[];
    readonly selectedPart: number;
    readonly selectedSegments: Segment[];
    readonly selectedToken: null | Token;
    setSelectedPart: (part: number) => void;
    setSelectedToken: (token: null | Token) => void;
    setTranscripts: (fileToTranscript: Record<string, ParagrafsSegment[]>) => void;
    toggleSegmentSelection: (segment: Segment, selected: boolean) => void;
    readonly transcripts: Record<string, Segment[]>;
    updateSegment: (update: Partial<Segment> & { id: number }) => void;
};

export const useTranscriptStore = create<TranscriptState>((set) => ({
    isInitialized: false,
    mergeSegments: () => {
        set((state) => {
            const [from, to] = state.selectedSegments;
            let segments = state.transcripts[state.selectedPart]!;
            const fromIndex = segments.findIndex((segment) => segment === from);
            const toIndex = segments.findIndex((segment) => segment === to);
            const merged = mergeSegments(segments.slice(fromIndex, toIndex + 1), '\n');
            segments = [...segments.slice(0, fromIndex), { ...merged, id: Date.now() }, ...segments.slice(toIndex + 1)];

            return {
                segments,
                selectedSegments: [],
                transcripts: {
                    ...state.transcripts,
                    [state.selectedPart]: segments,
                },
            };
        });
    },
    parts: [],
    segments: [],
    selectedPart: 0,
    selectedSegments: [],
    selectedToken: null,
    setSelectedPart: (part) =>
        set((state) => ({ segments: state.transcripts[part] || [], selectedPart: part, selectedSegments: [] })),
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

            const selectedPart = parts[0]!;

            return { isInitialized: true, parts, segments: transcripts[selectedPart]!, selectedPart, transcripts };
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
            const segments = list.map((seg) => (seg.id === upd.id ? { ...seg, ...upd } : seg));
            return {
                transcripts: { ...state.transcripts, segments, [state.selectedPart]: segments },
            };
        }),
}));
