import { areSimilarAfterNormalization } from 'kokokor';
import memoizeOne from 'memoize-one';

import { SWS_SYMBOL } from '@/lib/constants';

import type { ManuscriptStateCore, SheetLine } from './types';

export const selectAllSheetLines = memoizeOne((state: ManuscriptStateCore): SheetLine[] => {
    const lines = state.sheets.flatMap((sheet) => {
        return sheet.observations.map((o, i) => {
            const alt = sheet.alt[i]?.text || '';

            return {
                ...o,
                alt,
                hasInvalidFootnotes: Boolean(o.text.includes('()')),
                includesHonorifics: Boolean(alt.includes(SWS_SYMBOL) && !o.text.includes(SWS_SYMBOL)),
                isSimilar: Boolean(alt && areSimilarAfterNormalization(o.text, alt, 0.6)),
                page: sheet.page,
            };
        });
    });

    return lines;
});
