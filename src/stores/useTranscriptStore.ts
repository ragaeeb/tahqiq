import type { Segment as ParagrafsSegment, Token } from 'paragrafs';

import { create } from 'zustand';

export type Segment = ParagrafsSegment & {
    readonly id: number;
    status?: 'done';
};

type TranscriptState = {
    isInitialized: boolean;
    parts: number[];
    selectedIds: number[];
    selectedPart: number;
    selectedToken: null | Token;
    setSelectedPart: (part: number) => void;
    setSelectedToken: (token: null | Token) => void;
    setTranscripts: (fileToTranscript: Record<string, ParagrafsSegment[]>) => void;
    toggleSegmentSelection: (id: number, selected: boolean) => void;
    transcripts: Record<string, Segment[]>;
    updateSegment: (update: Partial<Segment> & { id: number }) => void;
};

export const useTranscriptStore = create<TranscriptState>((set) => ({
    isInitialized: false,
    parts: [],
    selectedIds: [],
    selectedPart: 0,
    selectedToken: null,
    setSelectedPart: (part) => set({ selectedIds: [], selectedPart: part }),
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
    toggleSegmentSelection: (segmentId, selected) =>
        set((state) => {
            return {
                selectedIds: selected
                    ? state.selectedIds.concat(segmentId)
                    : state.selectedIds.filter((id) => segmentId !== id),
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
