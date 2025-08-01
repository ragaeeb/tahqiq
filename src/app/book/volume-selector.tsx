'use client';

import { record } from 'nanolytics';
import React from 'react';

import { selectVolumes } from '@/stores/bookStore/selectors';
import { useBookStore } from '@/stores/bookStore/useBookStore';

/**
 * Renders a dropdown menu for selecting a book volume.
 *
 * Updates the selected volume in the book store when the user chooses a different option.
 */
export default function VolumeSelector() {
    const { selectedVolume, setSelectedVolume } = useBookStore();
    const volumes = useBookStore(selectVolumes);

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
