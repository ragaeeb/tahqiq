import { areSimilarAfterNormalization } from 'baburchi';
import { hasInvalidFootnotes } from 'baburchi';
import memoizeOne from 'memoize-one';

import { SWS_SYMBOL } from '@/lib/constants';

import type { ManuscriptStateCore, SheetLine } from './types';

export const selectAllSheetLines = memoizeOne(({ idsFilter, sheets }: ManuscriptStateCore): SheetLine[] => {
    const lines = sheets
        .filter((s) => s.observations.length > 0)
        .flatMap((sheet) => {
            return sheet.observations.map((o, i) => {
                const alt = sheet.alt[i] || '';

                return {
                    ...o,
                    alt,
                    hasInvalidFootnotes: hasInvalidFootnotes(o.text),
                    includesHonorifics: Boolean(alt.includes(SWS_SYMBOL) && !o.text.includes(SWS_SYMBOL)),
                    isSimilar: Boolean(alt && areSimilarAfterNormalization(o.text, alt, 0.6)),
                    page: sheet.page,
                };
            });
        });

    if (idsFilter.size > 0) {
        return lines.filter((line) => idsFilter.has(line.id));
    }

    return lines;
});
