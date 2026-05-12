import { sanitizeArabic } from 'baburchi';
import { countWords, preformatArabicText } from 'bitaboom';
import { type Page, type Segment, type SegmentValidationReport, segmentPages, validateSegments } from 'flappa-doormal';
export type DebugMeta = {
    contentLengthSplit?: { splitReason: string; maxContentLength?: number };
    metaKey?: string;
    [key: string]: any;
};

import { LatestContractVersion, Markers, SHORT_SEGMENT_WORD_THRESHOLD } from '@/lib/constants';
import { applyReplacements } from '@/lib/replace';
import { nowInSeconds } from '@/lib/time';
import type { Compilation, Excerpt, ExcerptType, Heading, IndexedExcerpt } from '@/stores/excerptsStore/types';
import type { BookSegmentationOptions } from '@/stores/segmentationStore/types';

const MAX_LETTERS = 26;

const getSegmentId = (s: Segment, totalExcerptsInPage: number) => {
    const type = s.meta?.type as ExcerptType;
    let prefix: Markers = Markers.Plain;

    if (totalExcerptsInPage > MAX_LETTERS * 2) {
        prefix = Markers.Footnote;
        totalExcerptsInPage -= MAX_LETTERS * 2;
    }

    if (totalExcerptsInPage > MAX_LETTERS) {
        prefix = Markers.Note;
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
        const isMergable =
            (countWords(current.content || '') < minWordCount || countWords(next.content || '') < minWordCount) &&
            current.from === next.from &&
            current.to === next.to;

        if (isMergable) {
            current.content = `${current.content || ''}\n${next.content || ''}`;
        } else {
            result.push(current);
            current = { ...next };
        }
    }
    result.push(current);
    return result;
};

export const mapPagesToExcerpts = (
    pages: Page[],
    headings: Page[],
    options: BookSegmentationOptions,
): Compilation & { report: SegmentValidationReport } => {
    const {
        replace: replaceRules,
        minWordsPerSegment = SHORT_SEGMENT_WORD_THRESHOLD,
        ...segmentationOptions
    } = options;
    pages = applyReplacements(pages, replaceRules);
    let segments = segmentPages(pages, segmentationOptions);
    const report = validateSegments(pages, options, segments);

    segments = mergeShortSegments(segments, minWordsPerSegment);
    let texts = preformatArabicText(segments.map((s) => s.content)); // format the segments not the pages because the pages might have segmentation rules based on the original format
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

    texts = preformatArabicText(headings.map((h) => h.content));

    return {
        contractVersion: LatestContractVersion.Excerpts,
        createdAt: nowInSeconds(),
        excerpts: excerpts as Excerpt[],
        footnotes: [],
        headings: headings.map((t, i) => {
            return { from: t.id, id: `T${t.id}`, nass: texts[i] };
        }) as Heading[],
        lastUpdatedAt: nowInSeconds(),
        options,
        postProcessingApps: [],
        promptForTranslation: '',
        report,
    };
};

export const canMergeSegments = <T extends { id: string }>(selectedIds: Set<string>, excerpts: T[]) => {
    if (selectedIds.size < 2) {
        return false;
    }

    // Get indices of selected excerpts
    const indices: number[] = [];
    for (let i = 0; i < excerpts.length; i++) {
        if (selectedIds.has(excerpts[i].id)) {
            indices.push(i);
        }
    }

    if (indices.length < 2) {
        return false;
    }

    // Check if consecutive
    indices.sort((a, b) => a - b);
    for (let i = 1; i < indices.length; i++) {
        if (indices[i] !== indices[i - 1] + 1) {
            return false;
        }
    }
    return true;
};

export const getMetaKey = (debug: unknown): string => {
    if (debug && typeof debug === 'object' && typeof (debug as any).metaKey === 'string') {
        return (debug as any).metaKey;
    }
    return '_flappa';
};

export const getSegmentFilterKey = (dbg: DebugMeta | undefined): string => {
    if (!dbg) {
        return 'none'; // Or 'unknown'
    }

    // 1. Safety Splits (Max Content Length)
    if (dbg.contentLengthSplit) {
        return `contentLengthSplit:${dbg.contentLengthSplit.splitReason}`;
    }

    // 2. Rule-based Splits
    if (dbg.rule) {
        // You can return just 'rule-only' or group by pattern type
        return 'rule-only';
    }

    // 3. Breakpoint Splits
    if (dbg.breakpoint) {
        const { kind, pattern, word } = dbg.breakpoint;

        // Handle Page Boundary fallback
        if (kind === 'pageBoundary' || (!pattern && !word)) {
            return 'breakpoint:page-boundary';
        }

        // Handle Word List matches (pattern is usually undefined here)
        if (word) {
            return `breakpoint:word:${word}`;
        }

        // Handle Regex/Pattern matches
        return `breakpoint:${pattern}`;
    }

    return 'unknown';
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
