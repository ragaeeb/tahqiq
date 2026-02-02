import { sanitizeArabic } from 'baburchi';
import { countWords, preformatArabicText } from 'bitaboom';
import type { CharacterRange } from 'dyelight';
import { type Page, type Segment, type SegmentValidationReport, segmentPages, validateSegments } from 'flappa-doormal';
import type { Segment as TextSegment, ValidationError } from 'wobble-bibble';
import {
    LatestContractVersion,
    MAX_CONSECUTIVE_GAPS_TO_FLAG,
    Markers,
    MIN_ARABIC_LENGTH_FOR_TRUNCATION_CHECK,
    MIN_TRANSLATION_RATIO,
    SHORT_SEGMENT_WORD_THRESHOLD,
} from '@/lib/constants';
import { applyReplacements } from '@/lib/replace';
import { nowInSeconds } from '@/lib/time';
import type { Compilation, Excerpt, ExcerptType, Heading, IndexedExcerpt } from '@/stores/excerptsStore/types';
import type { BookSegmentationOptions } from '@/stores/segmentationStore/types';

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

/**
 * Get untranslated excerpt IDs not in the "sent" set
 */
export const getUntranslatedIds = (excerpts: Excerpt[], sentIds: Set<string>) => {
    return excerpts.filter((e) => !e.text && !sentIds.has(e.id)).map((e) => e.id);
};

/**
 * Builds an array of validation segments for wobble-bibble's validateTranslationResponse.
 * Maps the nass (Arabic source) field to text as expected by the library.
 *
 * @param excerpts - Array of excerpts
 * @param headings - Array of headings
 * @param footnotes - Array of footnotes
 * @returns Array of segments with { id, text } where text is the nass value
 */
export const buildCorpusSnapshot = (excerpts: Excerpt[], headings: Heading[], footnotes: Excerpt[]) => {
    const untranslated: TextSegment[] = [];
    const translatedIds = new Set<string>();

    for (const e of [...excerpts, ...headings, ...footnotes]) {
        if (e.text) {
            translatedIds.add(e.id);
        } else {
            untranslated.push({ id: e.id, text: e.nass });
        }
    }

    return { translatedIds, untranslated };
};

/**
 * Converts wobble-bibble validation errors to DyeLight character range highlights.
 * Each error's range is mapped to a red background highlight.
 * Includes the original Arabic source text in the tooltip if segments are provided.
 *
 * @param errors - Array of validation errors with range information
 * @param segments - Optional source segments to look up Arabic text for tooltips
 * @returns Array of CharacterRange objects for DyeLight highlights prop
 */
export const errorsToHighlights = (errors: ValidationError[]): CharacterRange[] => {
    return errors.map((error) => ({ className: 'bg-red-200', end: error.range.end, start: error.range.start }));
};

/**
 * Detects when a translation appears truncated compared to its Arabic source.
 * This catches LLM errors where only a portion of the text was translated.
 *
 * @param arabicText - The original Arabic text
 * @param translationText - The English/target translation
 * @returns Error message describing the issue, or undefined if valid
 */
export const detectTruncatedTranslation = (
    arabicText: string | null | undefined,
    translationText: string | null | undefined,
): string | undefined => {
    const arabic = (arabicText ?? '').trim();
    const translation = (translationText ?? '').trim();

    // Skip check if Arabic is empty or too short
    if (arabic.length < MIN_ARABIC_LENGTH_FOR_TRUNCATION_CHECK) {
        return;
    }

    // Check for empty/whitespace-only translation with substantial Arabic
    if (translation.length === 0) {
        return `Translation appears empty but Arabic text has ${arabic.length} characters`;
    }

    // Calculate the ratio of translation to Arabic length
    const ratio = translation.length / arabic.length;

    // If ratio is below threshold, the translation is likely truncated
    if (ratio < MIN_TRANSLATION_RATIO) {
        const expectedMinLength = Math.round(arabic.length * MIN_TRANSLATION_RATIO);
        return `Translation appears truncated: ${translation.length} chars for ${arabic.length} char Arabic text (expected at least ~${expectedMinLength} chars)`;
    }
};

/**
 * Item type for gap/issue detection (has both nass and text fields).
 */
type ExcerptIssueItem = { id: string; nass?: string | null; text?: string | null };

/**
 * Finds all excerpts with issues: gaps (missing translations surrounded by translations)
 * and truncated translations (suspiciously short compared to Arabic source).
 *
 * Gap detection:
 * - A gap is one or more consecutive items without translation, surrounded by items with translations
 * - Only flags gaps if there are 1 to MAX_CONSECUTIVE_GAPS_TO_FLAG consecutive missing items
 *
 * Truncation detection:
 * - Only checks items that HAVE a translation (text is defined and non-empty)
 * Checks if a translation is truncated compared to its Arabic source.
 */
function isTranslationTruncated(item: ExcerptIssueItem): boolean {
    return !!detectTruncatedTranslation(item.nass, item.text);
}

/**
 * Checks if a segment point is a gap surrounded by translations
 */
function isSurroundedGap(items: ExcerptIssueItem[], start: number, end: number): boolean {
    const hasPrev = start > 0 && !!items[start - 1].text?.trim();
    const hasNext = end < items.length - 1 && !!items[end + 1].text?.trim();
    return hasPrev && hasNext && end - start + 1 <= MAX_CONSECUTIVE_GAPS_TO_FLAG;
}

/**
 * Finds all issues in a list of items: gaps (missing translations between translated blocks)
 * and truncated translations (too short for the Arabic text).
 *
 * @param items - List of items to check
 * @returns Array of IDs that have issues
 */
export const findExcerptIssues = (items: ExcerptIssueItem[]): string[] => {
    const issueIds = new Set<string>();

    let i = 0;
    while (i < items.length) {
        if (items[i].text?.trim()) {
            // Check for truncation if it has text
            if (isTranslationTruncated(items[i])) {
                issueIds.add(items[i].id);
            }
            i++;
            continue;
        }

        // Found an item without translation - find the end of this gap
        const start = i;
        while (i + 1 < items.length && !items[i + 1].text?.trim()) {
            i++;
        }

        // Check if this gap is surrounded by translated items and within size limit
        if (isSurroundedGap(items, start, i)) {
            for (let j = start; j <= i; j++) {
                issueIds.add(items[j].id);
            }
        }
        i++;
    }

    return Array.from(issueIds);
};

export type DebugMeta = {
    rule?: { index: number; patternType: string };
    breakpoint?: { index: number; pattern: string; kind: string };
    contentLengthSplit?: {
        maxContentLength: number;
        splitReason: 'whitespace' | 'unicode_boundary' | 'grapheme_cluster';
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

function summarizeArray(arr: any[]): string {
    if (arr.length === 0) {
        return '';
    }
    return arr.length > 1 ? `${arr[0]} (+${arr.length - 1})` : (arr[0] ?? '');
}

export const summarizeRulePattern = (rule: any) => {
    if (!rule || typeof rule !== 'object') {
        return '';
    }
    if (Array.isArray(rule.lineStartsWith)) {
        return summarizeArray(rule.lineStartsWith);
    }
    if (Array.isArray(rule.lineStartsAfter)) {
        return summarizeArray(rule.lineStartsAfter);
    }
    if (Array.isArray(rule.lineEndsWith)) {
        return summarizeArray(rule.lineEndsWith);
    }
    return (rule.template as string) || (rule.regex as string) || '';
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
