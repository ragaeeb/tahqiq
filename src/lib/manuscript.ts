import { formatTextBlocks, mapTextLinesToParagraphs } from 'kokokor';

import type { Juz } from '@/stores/bookStore/types';
import type { ManuscriptStateCore } from '@/stores/manuscriptStore/types';

import { LatestContractVersion } from './constants';
import { preformatArabicText } from './textUtils';

const FOOTNOTE_DIVIDER = '____________';

export const mapManuscriptToJuz = (manuscriptState: ManuscriptStateCore): Juz => {
    const sheets = manuscriptState.sheets.map((s) => {
        const paragraphs = mapTextLinesToParagraphs(s.observations);
        const text = formatTextBlocks(paragraphs, FOOTNOTE_DIVIDER);
        const [body, footnotes] = text.split(FOOTNOTE_DIVIDER);

        return {
            page: s.page,
            text: preformatArabicText(body, true),
            ...(footnotes && { footnotes: preformatArabicText(footnotes, true) }),
        };
    });

    const index = manuscriptState.sheets.flatMap((s) => {
        return s.observations.filter((o) => o.isHeading).map((o) => ({ page: s.page, title: o.text }));
    });

    return {
        contractVersion: LatestContractVersion.Juz,
        index,
        sheets,
        timestamp: new Date(),
        type: 'juz',
    };
};
