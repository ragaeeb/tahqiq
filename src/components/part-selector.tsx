'use client';

import React from 'react';

import { selectParts } from '@/stores/selectors';
import { useTranscriptStore } from '@/stores/useTranscriptStore';

export default function PartSelector() {
    const { selectedPart, setSelectedPart } = useTranscriptStore();
    const parts = useTranscriptStore(selectParts);

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
