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
}
