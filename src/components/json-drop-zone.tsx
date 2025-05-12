'use client';

import { useCallback, useEffect } from 'react';

type Props = {
    onFiles: (map: Record<string, unknown>) => void;
};

export default function JsonDropZone({ onFiles }: Props) {
    const handleDrop = useCallback(
        async (e: DragEvent) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.name.endsWith('.json'));
            if (!files.length) return;

            const map: Record<string, unknown> = {};
            for (const f of files) {
                try {
                    const data = JSON.parse(await f.text());
                    map[f.name.replace(/\.json$/, '')] = data;
                } catch {
                    console.error('bad json:', f.name);
                }
            }
            onFiles(map);
        },
        [onFiles],
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
