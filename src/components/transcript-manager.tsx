'use client';

import { useTranscriptStore } from '@/stores/useTranscriptStore';
import { formatSecondsToTimestamp } from 'paragrafs';

import JsonDropZone from './json-drop-zone';
import PartSelector from './part-selector';
import SegmentItem from './segment-item';

export default function TranscriptManager() {
    const { isInitialized, selectedPart, selectedToken, setTranscripts, transcripts } = useTranscriptStore();

    return (
        <div className="flex flex-col w-full max-w">
            <JsonDropZone onFiles={setTranscripts as any} />

            <div className="flex items-center justify-between mb-4">
                <PartSelector />

                <div className="flex space-x-2">
                    <button className="px-3 py-1 border rounded hover:bg-gray-100">Save</button>
                    <button className="px-3 py-1 border rounded hover:bg-gray-100">Export</button>
                    <button className="px-3 py-1 border rounded hover:bg-gray-100">Clear</button>
                </div>
            </div>

            {isInitialized ? (
                <div className="overflow-auto border rounded">
                    <table className="w-full table-auto divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-1 w-8 text-left">
                                    <input className="form-checkbox" type="checkbox" />
                                </th>
                                <th className="px-2 py-1 w-36 text-left">
                                    Time: {selectedToken && formatSecondsToTimestamp(selectedToken.start)}
                                </th>
                                <th className="px-4 py-1 text-right">النص</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {transcripts[selectedPart]?.map((segment) => (
                                <SegmentItem key={segment.id} segment={segment} />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-500">Drag & drop your JSON transcript files anywhere on this page.</p>
            )}
        </div>
    );
}
