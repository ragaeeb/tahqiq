'use client';

import { useMemo } from 'react';

import { selectCurrentSegments, useTranscriptStore } from '@/stores/useTranscriptStore';

import JsonDropZone from './json-drop-zone';
import PartSelector from './part-selector';
import SegmentItem from './segment-item';
import Toolbar from './toolbar';

export default function Transcript() {
    const isInitialized = useTranscriptStore((state) => state.isInitialized);
    const setTranscripts = useTranscriptStore((state) => state.setTranscripts);
    const selectAllSegments = useTranscriptStore((state) => state.selectAllSegments);
    const segments = useTranscriptStore(selectCurrentSegments);
    const segmentItems = useMemo(() => {
        return segments.map((segment) => <SegmentItem key={segment.id} segment={segment} />);
    }, [segments]);

    return (
        <div className="flex flex-col w-full max-w">
            <JsonDropZone onFiles={setTranscripts as any} />

            <div className="flex items-center justify-between mb-4">
                <PartSelector />
                <Toolbar />
            </div>

            {isInitialized ? (
                <div className="overflow-auto border rounded">
                    <table className="w-full table-auto divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-1 w-8 text-left">
                                    <input
                                        className="form-checkbox"
                                        onChange={(e) => selectAllSegments(e.target.checked)}
                                        type="checkbox"
                                    />
                                </th>
                                <th className="px-2 py-1 w-36 text-left">Time:</th>
                                <th className="px-4 py-1 text-right">النص</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">{segmentItems}</tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-500">Drag & drop your JSON transcript files anywhere on this page.</p>
            )}
        </div>
    );
}
