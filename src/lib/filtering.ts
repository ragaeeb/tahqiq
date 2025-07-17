import type { SheetLine } from '@/stores/manuscriptStore/types';

export const filterRowsByDivergence = (rows: SheetLine[]) => {
    const pageToTotalDivergence: Record<string, number> = {};

    rows.forEach((r) => {
        if (!r.isSimilar) {
            const current = pageToTotalDivergence[r.page] || 0;
            pageToTotalDivergence[r.page] = current + 1;
        }
    });

    const pages = Object.keys(pageToTotalDivergence)
        .filter((page) => {
            const current = pageToTotalDivergence[page];
            return current > 3;
        })
        .map(Number);

    return pages;
};
