'use client';

import { useMemo } from 'react';

import { selectCurrentSegments } from '@/stores/selectors';
import { useTranscriptStore } from '@/stores/useTranscriptStore';

import JsonDropZone from './json-drop-zone';
import PartSelector from './part-selector';
import SegmentItem from './segment-item';
import Toolbar from './toolbar';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';

export default function Transcript() {
    const isInitialized = useTranscriptStore((state) => state.isInitialized);
    const setTranscripts = useTranscriptStore((state) => state.setTranscripts);
    const selectAllSegments = useTranscriptStore((state) => state.selectAllSegments);
    const segments = useTranscriptStore(selectCurrentSegments);
    const segmentItems = useMemo(() => {
        return (segments || []).map((segment) => <SegmentItem key={segment.id} segment={segment} />);
    }, [segments]);

    if (!isInitialized) {
        return (
            <div className="flex flex-col w-full max-w">
                <JsonDropZone onFiles={setTranscripts as any} />
                <div className="flex items-center justify-center mb-4">
                    <p className="text-gray-500 flex">Drag & drop your JSON transcript files anywhere on this page.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col w-full max-w">
                <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                    <PartSelector />
                    <Toolbar />
                </div>

                <div className="overflow-auto border rounded">
                    <table className="w-full table-auto divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-1 w-8 text-left">
                                    <Checkbox
                                        onCheckedChange={(isSelected) => selectAllSegments(Boolean(isSelected))}
                                    />
                                </th>
                                <th className="px-2 py-1 w-36 text-left">Time:</th>
                                <th className="px-4 py-1 text-right">النص</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">{segmentItems}</tbody>
                    </table>
                </div>
            </div>
            <footer className="mt-auto row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
                <Textarea />
            </footer>
        </>
    );
}
