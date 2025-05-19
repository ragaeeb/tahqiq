'use client';

import { useCallback, useEffect } from 'react';

type JsonData = Record<string, Record<number | string, unknown> | unknown[]>;

type Props = {
    onFile: (map: JsonData) => void;
};

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
