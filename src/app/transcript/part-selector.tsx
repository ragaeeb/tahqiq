'use client';

import { record } from 'nanolytics';

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
            className="rounded border p-2"
            onChange={(e) => {
                record('SetTranscriptPart', e.target.value);
                setSelectedPart(parseInt(e.target.value));
            }}
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
