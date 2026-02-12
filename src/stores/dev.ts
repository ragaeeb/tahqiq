import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';

if (typeof window !== 'undefined') {
    (window as any).excerpts = {
        clearFilters: () => {
            const state = useExcerptsStore.getState();
            state.filterExcerptsByIds(undefined);
            state.filterHeadingsByIds(undefined);
            state.filterFootnotesByIds(undefined);
        },
        search: (regex: RegExp) => {
            const state = useExcerptsStore.getState();
            const ids = state.excerpts
                .filter((e) => regex.test(e.nass || '') || regex.test(e.text || ''))
                .map((e) => e.id);
            state.filterExcerptsByIds(ids);
        },
        searchFootnotes: (regex: RegExp) => {
            const state = useExcerptsStore.getState();
            const ids = state.footnotes.filter((f) => regex.test(f.nass) || regex.test(f.text || '')).map((f) => f.id);
            state.filterFootnotesByIds(ids);
        },
        searchHeadings: (regex: RegExp) => {
            const state = useExcerptsStore.getState();
            const ids = state.headings.filter((h) => regex.test(h.nass) || regex.test(h.text || '')).map((h) => h.id);
            state.filterHeadingsByIds(ids);
        },
    };
}
