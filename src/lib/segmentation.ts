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

export type DebugMeta = {
    rule?: { index: number; patternType: string };
    breakpoint?: { index: number; pattern: string; kind: string };
    contentLengthSplit?: {
        maxContentLength: number;
        splitReason: 'whitespace' | 'unicode_boundary' | 'grapheme_cluster';
    };
};

export const getMetaKey = (debug: unknown): string => {
    if (debug && typeof debug === 'object' && typeof (debug as any).metaKey === 'string') {
        return (debug as any).metaKey;
    }
    return '_flappa';
};

export const summarizeRulePattern = (rule: any) => {
    if (!rule || typeof rule !== 'object') {
        return '';
    }
    if (Array.isArray(rule.lineStartsWith)) {
        return rule.lineStartsWith.length > 1
            ? `${rule.lineStartsWith[0]} (+${rule.lineStartsWith.length - 1})`
            : (rule.lineStartsWith[0] ?? '');
    }
    if (Array.isArray(rule.lineStartsAfter)) {
        return rule.lineStartsAfter.length > 1
            ? `${rule.lineStartsAfter[0]} (+${rule.lineStartsAfter.length - 1})`
            : (rule.lineStartsAfter[0] ?? '');
    }
    if (Array.isArray(rule.lineEndsWith)) {
        return rule.lineEndsWith.length > 1
            ? `${rule.lineEndsWith[0]} (+${rule.lineEndsWith.length - 1})`
            : (rule.lineEndsWith[0] ?? '');
    }
    if (typeof rule.template === 'string') {
        return rule.template;
    }
    if (typeof rule.regex === 'string') {
        return rule.regex;
    }
    return '';
};

export const getSegmentFilterKey = (dbg: DebugMeta | undefined): string => {
    if (dbg?.contentLengthSplit) {
        return `contentLengthSplit:${dbg.contentLengthSplit.splitReason}`;
    }
    if (dbg?.breakpoint) {
        return `breakpoint:${dbg.breakpoint.pattern}`;
    }
    return 'rule-only';
};
