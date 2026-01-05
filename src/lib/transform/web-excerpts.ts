import { sanitizeArabic } from 'baburchi';
import { preformatArabicText } from 'bitaboom';
import type { Segment, SegmentationOptions } from 'flappa-doormal';
import { LatestContractVersion, TRANSLATE_EXCERPTS_PROMPT } from '@/lib/constants';
import type { Excerpt, Excerpts, ExcerptType, Heading, IndexedExcerpt } from '@/stores/excerptsStore/types';
import type { WebPage, WebTitle } from '@/stores/webStore/types';

const MAX_LETTERS = 26;

const getSegmentId = (s: Segment, totalExcerptsInPage: number) => {
    const type = s.meta?.type as ExcerptType;
    let prefix = totalExcerptsInPage > MAX_LETTERS ? 'N' : 'P';

    if (totalExcerptsInPage > MAX_LETTERS) {
        totalExcerptsInPage -= MAX_LETTERS;
    }

    const letter = String.fromCharCode(96 + totalExcerptsInPage);
    const id = `${s.from}${totalExcerptsInPage ? letter : ''}`;

    if (type === 'book') {
        prefix = 'B';
    }

    if (type === 'chapter') {
        prefix = 'C';
    }

    return `${prefix}${id}`;
};

/**
 * Converts web segments to excerpts format for use by the excerpts page.
 * Unlike ketab, web content doesn't have volume/page structure.
 */
export const webSegmentsToExcerpts = (
    webPages: WebPage[],
    titles: WebTitle[],
    segments: Segment[],
    options: SegmentationOptions,
): Excerpts => {
    let texts = segments.map((s) => s.content);
    texts = preformatArabicText(texts);
    const sanitized = sanitizeArabic(texts, 'aggressive');

    const excerpts: IndexedExcerpt[] = [];
    const idToPageCount = new Map<string, number>();

    for (let i = 0; i < sanitized.length; i++) {
        if (sanitized[i].length <= 2) {
            continue;
        }
        const s = segments[i];
        const segmentKey = `${s.from}${s.meta?.type || ''}`;
        const totalExcerptsInPage = idToPageCount.get(segmentKey) || 0;

        excerpts.push({
            from: s.from,
            id: getSegmentId(s, totalExcerptsInPage),
            ...(s.meta && { meta: s.meta }),
            nass: texts[i],
            ...(s.to && { to: s.to }),
            vol: 0,
            vp: 0,
        });

        idToPageCount.set(segmentKey, totalExcerptsInPage + 1);
    }

    return {
        contractVersion: LatestContractVersion.Excerpts,
        createdAt: Date.now() / 1000,
        excerpts: excerpts as Excerpt[],
        footnotes: [],
        headings: titles.map((t) => ({ from: t.page, id: `T${t.id}`, nass: t.content })) as Heading[],
        lastUpdatedAt: Date.now() / 1000,
        options,
        promptForTranslation: TRANSLATE_EXCERPTS_PROMPT.join('\n'),
    };
};
