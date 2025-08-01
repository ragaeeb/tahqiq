'use client';

import { record } from 'nanolytics';
import React from 'react';

import { selectVolumes } from '@/stores/bookStore/selectors';
import { useBookStore } from '@/stores/bookStore/useBookStore';

/**
 * Renders a dropdown menu for selecting a transcript part.
 *
 * Updates the selected part in the transcript store when the user chooses a different option.
 */
export default function VolumeSelector() {
    const { selectedVolume, setSelectedVolume } = useBookStore();
    const volumes = useBookStore(selectVolumes);
    console.log('volumes', volumes);

    return (
        <select
            className="p-2 border rounded"
            onChange={(e) => {
                record('SetBookVolume', e.target.value);
                setSelectedVolume(parseInt(e.target.value));
            }}
            value={selectedVolume}
        >
            {volumes.map((p) => (
                <option key={p} value={p}>
                    {p}
                </option>
            ))}
        </select>
    );
}
