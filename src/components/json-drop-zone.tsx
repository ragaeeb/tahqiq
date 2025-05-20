'use client';

import { useCallback, useEffect } from 'react';

import type { JsonData } from '@/stores/types';

type Props = {
    onFile: (map: JsonData) => void;
};

/**
 * React component that enables drag-and-drop uploading of a single JSON file and passes its parsed contents to a callback.
 *
 * @param onFile - Callback invoked with the parsed JSON object when a valid file is dropped.
 *
 * @remark
 * Only accepts exactly one file with a `.json` extension. If multiple or non-JSON files are dropped, the callback is not invoked.
 */
export default function JsonDropZone({ onFile }: Props) {
    const handleDrop = useCallback(
        async (e: DragEvent) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.name.endsWith('.json'));

            if (files.length !== 1) {
                return;
            }

            const data = JSON.parse(await files[0]!.text());
            onFile(data);
        },
        [onFile],
    );

    useEffect(() => {
        const prevent = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
        };
        const area = document.body;
        for (const evt of ['dragenter', 'dragover', 'dragleave', 'drop']) area.addEventListener(evt, prevent);
        area.addEventListener('drop', handleDrop);
        return () => {
            for (const evt of ['dragenter', 'dragover', 'dragleave', 'drop']) area.removeEventListener(evt, prevent);
            area.removeEventListener('drop', handleDrop);
        };
    }, [handleDrop]);

    return null;
}
