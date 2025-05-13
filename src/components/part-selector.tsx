'use client';

import React from 'react';

import { selectParts, useTranscriptStore } from '@/stores/useTranscriptStore';

export default function PartSelector() {
    const { selectedPart, setSelectedPart } = useTranscriptStore();
    const parts = useTranscriptStore(selectParts);

    if (parts.length === 0) {
        return null;
    }

    return (
        <select
            className="p-2 border rounded"
            onChange={(e) => setSelectedPart(parseInt(e.target.value))}
            value={selectedPart}
        >
            {parts.map((p) => (
                <option key={p} value={p}>
                    {p}
                </option>
            ))}
        </select>
    );
}
