import { areSimilarAfterNormalization } from 'baburchi';
import { hasInvalidFootnotes } from 'baburchi';
import memoizeOne from 'memoize-one';

import { AZW_SYMBOL, SWS_SYMBOL } from '@/lib/constants';

import type { ManuscriptStateCore, SheetLine } from './types';

export const selectAllSheetLines = memoizeOne(({ idsFilter, sheets }: ManuscriptStateCore): SheetLine[] => {
    const lines = sheets.flatMap((sheet) => {
        return sheet.observations.map((o, i) => {
            const alt = sheet.alt[i]?.text || '';

            return {
                ...o,
                alt,
                hasInvalidFootnotes: hasInvalidFootnotes(o.text),
                includesHonorifics: Boolean(
                    alt.includes(SWS_SYMBOL) && !(o.text.includes(SWS_SYMBOL) || o.text.includes(AZW_SYMBOL)),
                ),
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
