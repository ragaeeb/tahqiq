'use client';

import React from 'react';

import { selectParts } from '@/stores/transcriptStore/selectors';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

/**
 * Renders a dropdown menu for selecting a transcript part.
 *
 * Updates the selected part in the transcript store when the user chooses a different option.
 */
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
