import { areSimilarAfterNormalization } from 'kokokor';
import memoizeOne from 'memoize-one';

import type { ManuscriptStateCore, SheetLine } from './types';

export const selectAllSheetLines = memoizeOne((state: ManuscriptStateCore): SheetLine[] => {
    const lines = state.sheets.flatMap((sheet) => {
        return sheet.observations.map((o, i) => {
            const alt = sheet.alt[i]?.text;

            return {
                ...o,
                alt: alt || '',
                isSimilar: Boolean(alt && areSimilarAfterNormalization(o.text, alt, 0.6)),
                page: sheet.page,
            };
        });
    });

    return lines;
});
