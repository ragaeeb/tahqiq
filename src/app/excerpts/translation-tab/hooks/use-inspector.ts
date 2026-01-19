'use client';

import type { DyeLightRef } from 'dyelight';
import { useCallback, useRef, useState } from 'react';

export function useInspector() {
    const [inspectorSegmentId, setInspectorSegmentId] = useState<string | null>(null);
    const dyeLightRef = useRef<DyeLightRef>(null);

    const inspectSegment = useCallback((e: React.MouseEvent, id: string, range?: { start: number; end: number }) => {
        e.preventDefault();
        e.stopPropagation();

        setInspectorSegmentId(id);

        setTimeout(() => {
            if (range && dyeLightRef.current) {
                const textarea = document.getElementById('translations') as HTMLTextAreaElement;
                if (textarea) {
                    const behavior = window.matchMedia('(prefers-reduced-motion: no-preference)').matches
                        ? 'smooth'
                        : 'auto';

                    dyeLightRef.current.scrollToPosition(range.start, 60, behavior);

                    setTimeout(() => {
                        if (dyeLightRef.current) {
                            dyeLightRef.current.scrollToPosition(range.start, 60, behavior);
                        }
                    }, 300);
                }
            }
        }, 50);
    }, []);

    return { dyeLightRef, inspectorSegmentId, inspectSegment, setInspectorSegmentId };
}
