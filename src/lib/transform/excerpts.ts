import { sanitizeArabic } from 'baburchi';
import { type Page, type Segment, type SegmentationOptions, segmentPages } from 'flappa-doormal';
import type { Title } from 'shamela';
import type { Excerpt, Excerpts, ExcerptType, Heading, IndexedExcerpt } from '@/stores/excerptsStore/types';
import type { ShamelaPage } from '@/stores/shamelaStore/types';
import { LatestContractVersion } from '../constants';
import { preformatArabicText } from '../textUtils';

export const DEFAULT_OPTIONS = `{
    "breakpoints": [{ "pattern": "{{tarqim}}\\\\s*" }, ""],
    "maxPages": 1,
    "prefer": "longer",
    "rules": [
        {
            "fuzzy": true,
            "lineStartsWith": ["{{basmalah}}"],
            "split": "at"
        },
        {
            "fuzzy": true,
            "lineStartsWith": ["{{bab}}"],
            "meta": { "type": "chapter" },
            "split": "at"
        },
        {
            "lineStartsAfter": ["##"],
            "meta": { "type": "chapter" },
            "split": "at"
        },
        {
            "fuzzy": true,
            "lineStartsWith": ["{{kitab}}"],
            "meta": { "type": "book" },
            "split": "at"
        },
        {
            "lineStartsAfter": ["{{raqms:num}} {{dash}}"],
            "split": "at"
        }
    ]
}`;

const htmlToMarkdown = (html: string) => {
    return (
        html
            // Move content after line break (or at start) but before title span INTO the span
            .replace(/(^|\r)([^\r]*?)<span[^>]*data-type=["']title["'][^>]*>/gi, '$1<span data-type="title">$2')
            // Convert title spans to markdown headers
            .replace(/<span[^>]*data-type=["']title["'][^>]*>(.*?)<\/span>/gi, '## $1')
            // Strip narrator links but keep text
            .replace(/<a[^>]*href=["']inr:\/\/[^"']*["'][^>]*>(.*?)<\/a>/gi, '$1')
            // Strip all remaining HTML tags
            .replace(/<[^>]*>/g, '')
            .replace(/舄/g, '')
    );
};

const getSegmentId = (s: Segment, totalExcerptsInPage: number) => {
    const type = s.meta?.type as ExcerptType;
    const letter = String.fromCharCode(97 + totalExcerptsInPage);
    const id = `${s.from}${totalExcerptsInPage ? letter : ''}`;

    if (type === 'book') {
        return `B${id}`;
    }

    if (type === 'chapter') {
        return `C${id}`;
    }

    return `P${id}`;
};

const getIndexedShamelaPages = (shamelaPages: ShamelaPage[]) => {
    const pages: Page[] = [];
    const idToPage = new Map<number, ShamelaPage>();

    for (const page of shamelaPages) {
        idToPage.set(page.id, page);
        pages.push({ content: htmlToMarkdown(page.body), id: page.id });
    }

    return { idToPage, pages };
};

export const segmentShamelaPagesToExcerpts = (
    shamelaPages: ShamelaPage[],
    titles: Title[],
    options: SegmentationOptions,
): Excerpts => {
    const { pages, idToPage } = getIndexedShamelaPages(shamelaPages);

    const segments = segmentPages(pages, options).filter((s) => {
        return sanitizeArabic(s.content, 'aggressive').length > 2;
    });
    const excerpts: IndexedExcerpt[] = [];
    const idToPageCount = new Map<string, number>();

    for (const s of segments) {
        const segmentKey = `${s.from}${s.meta?.type || ''}`;
        const shamelaPage = idToPage.get(s.from)!;
        const totalExcerptsInPage = idToPageCount.get(segmentKey) || 0;

        excerpts.push({
            from: s.from,
            id: getSegmentId(s, totalExcerptsInPage),
            ...(s.meta && { meta: s.meta }),
            nass: preformatArabicText(s.content),
            ...(s.to && { to: s.to }),
            vol: Number(shamelaPage.part) || 0,
            vp: Number(shamelaPage.page) || 0,
        });

        idToPageCount.set(segmentKey, totalExcerptsInPage + 1);
    }

    return {
        contractVersion: LatestContractVersion.Excerpts,
        createdAt: Date.now() / 1000,
        excerpts: excerpts as Excerpt[],
        footnotes: [],
        headings: titles.map((t) => {
            return { id: `T${t.id}`, ...(t.parent && { parent: `T${t.parent}` }), from: t.page, nass: t.content };
        }) as Heading[],
        lastUpdatedAt: Date.now() / 1000,
    };
};
