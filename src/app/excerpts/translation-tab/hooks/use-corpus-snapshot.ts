'use client';

import { useMemo } from 'react';
import { buildCorpusSnapshot } from '@/lib/segmentation';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';

export function useCorpusSnapshot() {
    const excerpts = useExcerptsStore((state) => state.excerpts);
    const headings = useExcerptsStore((state) => state.headings);
    const footnotes = useExcerptsStore((state) => state.footnotes);

    return useMemo(() => buildCorpusSnapshot(excerpts, headings, footnotes), [excerpts, headings, footnotes]);
}
