'use client';

import { selectParts, useTranscriptStore } from '@/stores/useTranscriptStore';
import React from 'react';
import { shallow } from 'zustand/shallow';

export default function PartSelector() {
    const { selectedPart, setSelectedPart } = useTranscriptStore();
    const parts = useTranscriptStore(selectParts, shallow);

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
