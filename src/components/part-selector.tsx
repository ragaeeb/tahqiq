'use client';

import { useTranscriptStore } from '@/stores/useTranscriptStore';
import React from 'react';

export default function PartSelector() {
    const { parts, selectedPart, setSelectedPart } = useTranscriptStore();

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
