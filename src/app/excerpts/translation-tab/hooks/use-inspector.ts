'use client';

import type { DyeLightRef } from 'dyelight';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useInspector() {
    const [inspectorSegmentId, setInspectorSegmentId] = useState<string | null>(null);
    const dyeLightRef = useRef<DyeLightRef>(null);

    const inspectSegment = useCallback((e: React.MouseEvent, id: string, range?: { start: number; end: number }) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('[AddTranslationTab] inspectSegment called:', { id, range });
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

    // Monitor manual scroll to warn if reset (debugging artifact from original code, preserved)
    useEffect(() => {
        const textarea = document.getElementById('translations');
        if (textarea) {
            const handleManualScroll = () => {
                if (textarea.scrollTop === 0 && !!inspectorSegmentId) {
                    console.warn('[translations scroll] RESET TO 0 while inspector is active!');
                }
            };
            textarea.addEventListener('scroll', handleManualScroll);
            return () => textarea.removeEventListener('scroll', handleManualScroll);
        }
    }, [inspectorSegmentId]);

    return { dyeLightRef, inspectorSegmentId, inspectSegment, setInspectorSegmentId };
}
