import { sanitizeArabic } from 'baburchi';
import { preformatArabicText } from 'bitaboom';
import { type Page, type Segment, segmentPages } from 'flappa-doormal';
import {
    LatestContractVersion,
    Markers,
    SHORT_SEGMENT_WORD_THRESHOLD,
    TRANSLATE_EXCERPTS_PROMPT,
} from '@/lib/constants';
import { applyReplacements } from '@/lib/replace';
import { nowInSeconds } from '@/lib/time';
import type { Excerpt, Excerpts, ExcerptType, Heading, IndexedExcerpt } from '@/stores/excerptsStore/types';
import type { BookSegmentationOptions } from '@/stores/segmentationStore/types';
import { countWords } from './textUtils';

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

/**
 * Merges adjacent short excerpts that have the same `from` and `to` values.
 * Uses SHORT_SEGMENT_WORD_THRESHOLD as the minimum word count.
 *
 * @param state - The current state
 * @returns Number of excerpts merged (removed)
 */
export const mergeShortSegments = (segments: Segment[], minWordCount: number) => {
    if (segments.length < 2) {
        return segments;
    }

    const result: Segment[] = [];
    let current = { ...segments[0] };

    for (let i = 1; i < segments.length; i++) {
        const next = segments[i];
        const currentWordCount = countWords(current.content || '');
        const nextWordCount = countWords(next.content || '');

        // Check if either segment is short and have same from/to
        const currentIsShort = currentWordCount < minWordCount;
        const nextIsShort = nextWordCount < minWordCount;
        const sameFrom = current.from === next.from;
        const sameTo = current.to === next.to;

        if ((currentIsShort || nextIsShort) && sameFrom && sameTo) {
            // Merge: combine nass with newline separator
            current = {
                ...current,
                content: `${current.content || ''}\n${next.content || ''}`,
                // Keep first excerpt's text/translator, extend to if next has larger
                to: next.to && next.to > (current.to || current.from) ? next.to : current.to,
            };
        } else {
            // Push current and move to next
            result.push(current);
            current = { ...next };
        }
    }
    // Don't forget the last segment
    result.push(current);

    return result;
};

export const mapPagesToExcerpts = (pages: Page[], headings: Page[], options: BookSegmentationOptions): Excerpts => {
    const {
        replace: replaceRules,
        minWordsPerSegment = SHORT_SEGMENT_WORD_THRESHOLD,
        ...segmentationOptions
    } = options;
    pages = applyReplacements(pages, replaceRules);
    let segments = segmentPages(pages, segmentationOptions);
    segments = mergeShortSegments(segments, minWordsPerSegment);
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

type FilterOption = {
    type: 'all' | 'rule-only' | 'breakpoint' | 'contentLengthSplit';
    value?: string; // For breakpoint patterns or splitReason
    label: string;
    count: number;
};

export const buildSegmentFilterOptions = (segments: Excerpt[], metaKey: string, filterKey: string) => {
    const counts = new Map<string, number>();
    counts.set('all', segments.length);
    counts.set('rule-only', 0);

    // First pass: count occurrences of each filter key
    for (const seg of segments) {
        const dbg = (seg.meta as any)?.[metaKey] as DebugMeta | undefined;
        const key = getSegmentFilterKey(dbg);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    // Build filter options
    const opts: FilterOption[] = [{ count: counts.get('all') ?? 0, label: 'All segments', type: 'all' }];

    const ruleOnlyCount = counts.get('rule-only') ?? 0;
    if (ruleOnlyCount > 0) {
        opts.push({ count: ruleOnlyCount, label: 'Rule matches only', type: 'rule-only' });
    }

    // Add breakpoint patterns
    for (const [key, count] of counts) {
        if (key.startsWith('breakpoint:')) {
            const pattern = key.slice('breakpoint:'.length);
            const displayPattern = pattern === '' ? '<page-boundary>' : pattern;
            opts.push({ count, label: `Breakpoint: ${displayPattern}`, type: 'breakpoint', value: pattern });
        }
    }

    // Add contentLengthSplit reasons
    for (const [key, count] of counts) {
        if (key.startsWith('contentLengthSplit:')) {
            const reason = key.slice('contentLengthSplit:'.length);
            opts.push({ count, label: `Max length (${reason})`, type: 'contentLengthSplit', value: reason });
        }
    }

    // Filter segments based on selected filter
    const filtered = segments.filter((seg) => {
        // debug filter check
        const dbg = (seg.meta as any)?.[metaKey] as DebugMeta | undefined;
        return filterKey === 'all' || getSegmentFilterKey(dbg) === filterKey;
    });

    return { filteredSegments: filtered, filterOptions: opts };
};
