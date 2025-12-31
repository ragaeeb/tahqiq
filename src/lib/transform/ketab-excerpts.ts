import { sanitizeArabic } from 'baburchi';
import { preformatArabicText } from 'bitaboom';
import { type Page, type Segment, type SegmentationOptions, segmentPages } from 'flappa-doormal';
import { htmlToMarkdown } from 'ketab-online-sdk';
import { LatestContractVersion, TRANSLATE_EXCERPTS_PROMPT } from '@/lib/constants';
import type { Excerpt, Excerpts, ExcerptType, Heading, IndexedExcerpt } from '@/stores/excerptsStore/types';
import type { KetabPage, KetabTitle } from '@/stores/ketabStore/types';

const getKetabVolFromPart = (part: KetabPage['part']): number => {
    if (!part) {
        return 0;
    }
    const parsed = Number.parseInt(part.name, 10);
    return Number.isFinite(parsed) ? parsed : 0;
};

const getSegmentId = (s: Segment, totalExcerptsInPage: number) => {
    const type = s.meta?.type as ExcerptType;
    const letter = String.fromCharCode(96 + totalExcerptsInPage);
    const id = `${s.from}${totalExcerptsInPage ? letter : ''}`;

    if (type === 'book') {
        return `B${id}`;
    }

    if (type === 'chapter') {
        return `C${id}`;
    }

    return `P${id}`;
};

const getIndexedKetabPages = (ketabPages: KetabPage[]) => {
    const pages: Page[] = [];
    const idToPage = new Map<number, KetabPage>();

    for (const page of ketabPages) {
        idToPage.set(page.id, page);

        // Convert HTML to markdown for segmentation
        const content = htmlToMarkdown(page.body);

        pages.push({ content, id: page.id });
    }

    return { idToPage, pages };
};

const segmentAndSanitize = (ketabPages: KetabPage[], options: SegmentationOptions) => {
    const { pages, idToPage } = getIndexedKetabPages(ketabPages);

    const segments = segmentPages(pages, options);
    let texts = segments.map((s) => s.content);
    texts = preformatArabicText(texts);
    const sanitized = sanitizeArabic(texts, 'aggressive');
    const validSegments: Segment[] = [];

    for (let i = 0; i < sanitized.length; i++) {
        if (sanitized[i].length > 2) {
            segments[i].content = texts[i];
            validSegments.push(segments[i]);
        }
    }

    return { idToPage, segments: validSegments };
};

export const segmentKetabPagesToExcerpts = (
    ketabPages: KetabPage[],
    titles: KetabTitle[],
    options: SegmentationOptions,
): Excerpts => {
    const { segments, idToPage } = segmentAndSanitize(ketabPages, options);

    const excerpts: IndexedExcerpt[] = [];
    const idToPageCount = new Map<string, number>();

    for (const s of segments) {
        const segmentKey = `${s.from}${s.meta?.type || ''}`;
        const ketabPage = idToPage.get(s.from)!;
        const totalExcerptsInPage = idToPageCount.get(segmentKey) || 0;

        excerpts.push({
            from: s.from,
            id: getSegmentId(s, totalExcerptsInPage),
            ...(s.meta && { meta: s.meta }),
            nass: s.content,
            ...(s.to && { to: s.to }),
            vol: getKetabVolFromPart(ketabPage.part),
            vp: ketabPage.page || 0,
        });

        idToPageCount.set(segmentKey, totalExcerptsInPage + 1);
    }

    return {
        contractVersion: LatestContractVersion.Excerpts,
        createdAt: Date.now() / 1000,
        excerpts: excerpts as Excerpt[],
        footnotes: [],
        headings: titles.map((t) => {
            return { id: `T${t.id}`, ...(t.parent && { parent: `T${t.parent}` }), from: t.page, nass: t.title };
        }) as Heading[],
        lastUpdatedAt: Date.now() / 1000,
        options,
        promptForTranslation: TRANSLATE_EXCERPTS_PROMPT.join('\n'),
    };
};

export const ketabSegmentsToExcerpts = (
    ketabPages: KetabPage[],
    titles: KetabTitle[],
    segments: Segment[],
    options: SegmentationOptions,
): Excerpts => {
    const idToPage = new Map<number, KetabPage>();
    for (const p of ketabPages) {
        idToPage.set(p.id, p);
    }

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
        const ketabPage = idToPage.get(s.from);
        const totalExcerptsInPage = idToPageCount.get(segmentKey) || 0;

        excerpts.push({
            from: s.from,
            id: getSegmentId(s, totalExcerptsInPage),
            ...(s.meta && { meta: s.meta }),
            nass: texts[i],
            ...(s.to && { to: s.to }),
            vol: getKetabVolFromPart(ketabPage?.part ?? null),
            vp: ketabPage?.page || 0,
        });

        idToPageCount.set(segmentKey, totalExcerptsInPage + 1);
    }

    return {
        contractVersion: LatestContractVersion.Excerpts,
        createdAt: Date.now() / 1000,
        excerpts: excerpts as Excerpt[],
        footnotes: [],
        headings: titles.map((t) => {
            return { id: `T${t.id}`, ...(t.parent && { parent: `T${t.parent}` }), from: t.page, nass: t.title };
        }) as Heading[],
        lastUpdatedAt: Date.now() / 1000,
        options,
        promptForTranslation: TRANSLATE_EXCERPTS_PROMPT.join('\n'),
    };
};
