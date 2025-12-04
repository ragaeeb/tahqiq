import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

if (typeof window !== 'undefined') {
    (window as any).manuscript = {
        replace: (pattern: RegExp | string, replacement: string) => {
            const state = useManuscriptStore.getState();
            state.searchAndReplace(pattern, replacement);
        },
        search: (regex: RegExp) => {
            const state = useManuscriptStore.getState();
            const ids = state.sheets.flatMap((s) => {
                return s.observations.filter((o) => regex.test(o.text)).map((o) => o.id);
            });

            state.filterByIds(ids);
        },
    };

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
                .filter((e) => regex.test(e.arabic || '') || regex.test(e.translation || ''))
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
