import type { BookStateCore, Kitab } from '@/stores/bookStore/types';

import { LatestContractVersion } from './constants';

export const mapBookStateToKitab = (state: BookStateCore): Kitab => {
    return {
        contractVersion: LatestContractVersion.Book,
        createdAt: state.createdAt,
        index: Object.entries(state.volumeToIndex)
            .flatMap(([volume, bookmarks]) => {
                return bookmarks.map((b) => ({ page: b.page, title: b.title, volume: Number(volume) }));
            })
            .sort((a, b) => a.page - b.page),
        lastUpdatedAt: new Date(),
        pages: Object.entries(state.volumeToPages).flatMap(([, pages]) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            return pages.map(({ id, lastUpdate, ...p }) => ({ ...p }));
        }),
        type: 'book',
    };
};

export const mapKitabToLegacyFormat = (kitab: Kitab) => {
    return {
        bookmarks: kitab.index,
        pages: kitab.pages.map((p) => ({
            body: [p.text, p.footnotes].filter(Boolean).join('_\n'),
            page: p.page,
            part: p.volume,
            pp: p.volumePage,
        })),
    };
};
