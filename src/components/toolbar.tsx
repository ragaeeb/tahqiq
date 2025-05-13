'use client';

import { useTranscriptStore } from '@/stores/useTranscriptStore';
import { formatSecondsToTimestamp } from 'paragrafs';
import React from 'react';

export default function Toolbar() {
    const { isInitialized, mergeSegments, selectedSegments } = useTranscriptStore();

    if (!isInitialized) {
        return null;
    }

    const sortedSegments = selectedSegments.toSorted((a, b) => a.start - b.start);

    return (
        <div className="flex space-x-2">
            {selectedSegments.length === 2 && (
                <button className="px-3 py-1 border rounded hover:bg-gray-100" onClick={mergeSegments}>
                    🔗 {formatSecondsToTimestamp(sortedSegments[0]!.start)} -{' '}
                    {formatSecondsToTimestamp(sortedSegments.at(-1)!.end)} (
                    {formatSecondsToTimestamp(Math.ceil(sortedSegments.at(-1)!.end - sortedSegments[0]!.start))})
                </button>
            )}
            <button className="px-3 py-1 border rounded hover:bg-gray-100">Export</button>
            <button className="px-3 py-1 border rounded hover:bg-gray-100">Clear</button>
        </div>
    );
}
