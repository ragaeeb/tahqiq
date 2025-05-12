'use client';

import { useTranscriptStore } from '@/stores/useTranscriptStore';

import JsonDropZone from './json-drop-zone';
import PartSelector from './part-selector';
import Transcript from './transcript';

export default function TranscriptManager() {
    const {
        selectedIds,
        selectedPart,
        setSelectedPart,
        setTranscripts,
        toggleSegmentSelection,
        transcripts,
        updateSegment,
    } = useTranscriptStore();

    const parts = Object.keys(transcripts).sort((a, b) => parseInt(a) - parseInt(b));

    return (
        <div className="flex flex-col w-full max-w">
            <JsonDropZone onFiles={setTranscripts as any} />

            <div className="flex items-center justify-between mb-4">
                {parts.length > 0 && <PartSelector onChange={setSelectedPart} parts={parts} selected={selectedPart} />}

                <div className="flex space-x-2">
                    <button className="px-3 py-1 border rounded hover:bg-gray-100">Save</button>
                    <button className="px-3 py-1 border rounded hover:bg-gray-100">Export</button>
                    <button className="px-3 py-1 border rounded hover:bg-gray-100">Clear</button>
                </div>
            </div>

            {parts.length > 0 ? (
                <Transcript
                    currentPart={selectedPart}
                    onUpdate={updateSegment}
                    onWordSelected={(w) => console.log('word selected', w)}
                    pageUrlTemplate="/player/{part-page}"
                    segments={transcripts[selectedPart] || []}
                    selectedIds={selectedIds}
                    toggleSegmentSelection={toggleSegmentSelection}
                />
            ) : (
                <p className="text-gray-500">Drag & drop your JSON transcript files anywhere on this page.</p>
            )}
        </div>
    );
}
