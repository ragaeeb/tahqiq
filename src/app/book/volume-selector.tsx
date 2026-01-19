'use client';

import { record } from 'nanolytics';

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
            className="rounded border p-2"
            onChange={(e) => {
                record('SetBookVolume', e.target.value);
                setSelectedVolume(parseInt(e.target.value, 10));
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
