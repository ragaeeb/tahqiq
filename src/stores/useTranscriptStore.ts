import type { Segment as ParagrafsSegment } from 'paragrafs';

import { create } from 'zustand';

export type Segment = ParagrafsSegment & {
    readonly id: number;
    status?: 'done';
};

type TranscriptState = {
    selectedIds: number[];
    selectedPart: string;
    setSelectedPart: (part: string) => void;
    setTranscripts: (fileToTranscript: Record<string, ParagrafsSegment[]>) => void;
    toggleSegmentSelection: (id: number, selected: boolean) => void;
    transcripts: Record<string, Segment[]>;
    updateSegment: (part: string, update: Partial<Segment> & { id: number }) => void;
};

export const useTranscriptStore = create<TranscriptState>((set) => ({
    selectedIds: [],
    selectedPart: '',
    setSelectedPart: (part) => set({ selectedIds: [], selectedPart: part }),
    setTranscripts: (fileToTranscript) =>
        set(() => {
            const parts = Object.keys(fileToTranscript).sort();
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

            return { selectedPart: parts[0]!, transcripts };
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
    updateSegment: (part, upd) =>
        set((state) => {
            const list = state.transcripts[part] || [];
            const updated = list.map((seg) => (seg.id === upd.id ? { ...seg, ...upd } : seg));
            return {
                transcripts: { ...state.transcripts, [part]: updated },
            };
        }),
}));
