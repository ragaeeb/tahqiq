import { sanitizeArabic } from 'baburchi';
import { fixTrailingWow, preformatArabicText } from 'bitaboom';
import { type Page, type Segment, type SegmentationOptions, segmentPages } from 'flappa-doormal';
import { LatestContractVersion, Markers, TRANSLATE_EXCERPTS_PROMPT } from '@/lib/constants';
import { nowInSeconds } from '@/lib/time';
import type { Excerpt, Excerpts, ExcerptType, Heading, IndexedExcerpt } from '@/stores/excerptsStore/types';
import { countWords } from './textUtils';

/**
 * Detects how many pairs of adjacent short excerpts could be merged.
 * Used to show a toast notification prompting the user to merge.
 *
 * @param excerpts - Array of excerpts to check
 * @param minWordCount - Minimum word count threshold for short excerpts
 * @returns Number of mergeable pairs
 */
export const detectMergeableShortExcerpts = (excerpts: IndexedExcerpt[], minWordCount: number) => {
    if (excerpts.length < 2) {
        return 0;
    }

    let mergeablePairs = 0;

    for (let i = 0; i < excerpts.length - 1; i++) {
        const current = excerpts[i];
        const next = excerpts[i + 1];

        const currentWordCount = countWords(current.nass || '');
        const nextWordCount = countWords(next.nass || '');

        const currentIsShort = currentWordCount < minWordCount;
        const nextIsShort = nextWordCount < minWordCount;
        const sameFrom = current.from === next.from;
        const sameTo = current.to === next.to;

        if ((currentIsShort || nextIsShort) && sameFrom && sameTo) {
            mergeablePairs++;
        }
    }

    return mergeablePairs;
};

const MAX_LETTERS = 26;

const getSegmentId = (s: Segment, totalExcerptsInPage: number) => {
    const type = s.meta?.type as ExcerptType;
    let prefix: Markers = totalExcerptsInPage > MAX_LETTERS ? Markers.Note : Markers.Plain;

    if (totalExcerptsInPage > MAX_LETTERS) {
        totalExcerptsInPage -= MAX_LETTERS;
    }

    const letter = String.fromCharCode(96 + totalExcerptsInPage);
    const id = `${s.from}${totalExcerptsInPage ? letter : ''}`;

    if (type === Markers.Book || type === Markers.Chapter) {
        prefix = type;
    }

    return `${prefix}${id}`;
};

class IdGenerator {
    private idToPageCount = new Map<string, number>();

    generateId(s: Segment) {
        const segmentKey = `${s.from}${s.meta?.type || ''}`;
        const totalExcerptsInPage = this.idToPageCount.get(segmentKey) || 0;
        const id = getSegmentId(s, totalExcerptsInPage);
        this.idToPageCount.set(segmentKey, totalExcerptsInPage + 1);

        return id;
    }
}

export const mapPagesToExcerpts = (pages: Page[], headings: Page[], options: SegmentationOptions): Excerpts => {
    pages = pages.map((p) => ({ content: fixTrailingWow(p.content), id: p.id }));
    const segments = segmentPages(pages, options);
    const texts = preformatArabicText(segments.map((s) => s.content)); // format the segments not the pages because the pages might have segmentation rules based on the original format
    const sanitized = sanitizeArabic(texts, 'aggressive'); // this is used to filter out false positives

    const excerpts: IndexedExcerpt[] = [];
    const generator = new IdGenerator();

    for (let i = 0; i < sanitized.length; i++) {
        if (sanitized[i].length > 2) {
            const s = segments[i];

            const excerpt: IndexedExcerpt = { from: s.from, id: generator.generateId(s), nass: texts[i] };

            if (s.to) {
                excerpt.to = s.to;
            }

            if (s.meta) {
                excerpt.meta = s.meta;
            }

            excerpts.push(excerpt);
        }
    }

    return {
        contractVersion: LatestContractVersion.Excerpts,
        createdAt: nowInSeconds(),
        excerpts: excerpts as Excerpt[],
        footnotes: [],
        headings: headings.map((t) => {
            return { from: t.id, id: `T${t.id}`, nass: t.content };
        }) as Heading[],
        lastUpdatedAt: nowInSeconds(),
        options,
        postProcessingApps: [],
        promptForTranslation: TRANSLATE_EXCERPTS_PROMPT.join('\n'),
    };
};

/**
 * Format excerpts for LLM prompt (matches handleExportToTxt format)
 */
export const formatExcerptsForPrompt = (excerpts: Excerpt[], prompt: string) => {
    const formatted = excerpts.map((e) => `${e.id} - ${e.nass}`).join('\n\n');
    return [prompt, formatted].join('\n\n\n');
};

/**
 * Get untranslated excerpt IDs not in the "sent" set
 */
export const getUntranslatedIds = (excerpts: Excerpt[], sentIds: Set<string>) => {
    return excerpts.filter((e) => !e.text && !sentIds.has(e.id)).map((e) => e.id);
};
