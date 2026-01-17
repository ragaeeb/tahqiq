import { sanitizeArabic } from 'baburchi';
import { countWords, preformatArabicText } from 'bitaboom';
import { type Page, type Segment, segmentPages } from 'flappa-doormal';
import { VALIDATION_ERROR_TYPE_INFO, type ValidationErrorType } from 'wobble-bibble';
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
import type { Excerpt, Excerpts, ExcerptType, Heading, IndexedExcerpt } from '@/stores/excerptsStore/types';
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
        promptForTranslation: '',
    };
};

/**
 * Format excerpts for LLM prompt (matches handleExportToTxt format)
 */
export const formatExcerptsForPrompt = (excerpts: Excerpt[], prompt: string, bookTitle?: string) => {
    // Replace placeholders
    const finalPrompt = bookTitle ? prompt.replace(/{{book}}/g, bookTitle) : prompt.replace(/{{book}}/g, 'this book');

    const formatted = excerpts.map((e) => `${e.id} - ${e.nass}`).join('\n\n');
    return [finalPrompt, formatted].join('\n\n');
};

/**
 * Get untranslated excerpt IDs not in the "sent" set
 */
export const getUntranslatedIds = (excerpts: Excerpt[], sentIds: Set<string>) => {
    return excerpts.filter((e) => !e.text && !sentIds.has(e.id)).map((e) => e.id);
};

/**
 * Item with nass field for validation segment building.
 */
type NassItem = { id: string; nass?: string | null };

/**
 * Item with text field for existing translations map building.
 */
type TextItem = { id: string; text?: string | null };

/**
 * Builds an array of validation segments for wobble-bibble's validateTranslationResponse.
 * Maps the nass (Arabic source) field to text as expected by the library.
 *
 * @param excerpts - Array of excerpts
 * @param headings - Array of headings
 * @param footnotes - Array of footnotes
 * @returns Array of segments with { id, text } where text is the nass value
 */
export const buildValidationSegments = (
    excerpts: NassItem[],
    headings: NassItem[],
    footnotes: NassItem[],
): { id: string; text: string }[] => {
    const result: { id: string; text: string }[] = [];

    for (const e of excerpts) {
        if (e.nass) {
            result.push({ id: e.id, text: e.nass });
        }
    }
    for (const h of headings) {
        if (h.nass) {
            result.push({ id: h.id, text: h.nass });
        }
    }
    for (const f of footnotes) {
        if (f.nass) {
            result.push({ id: f.id, text: f.nass });
        }
    }

    return result;
};

/**
 * Builds a map of IDs that already have translations (text field is non-empty).
 * Used to detect overwrites when applying new translations.
 *
 * @param excerpts - Array of excerpts
 * @param headings - Array of headings
 * @param footnotes - Array of footnotes
 * @returns Map where keys are IDs with existing translations
 */
export const buildExistingTranslationsMap = (
    excerpts: TextItem[],
    headings: TextItem[],
    footnotes: TextItem[],
): Map<string, boolean> => {
    const map = new Map<string, boolean>();

    for (const e of excerpts) {
        if (e.text?.trim()) {
            map.set(e.id, true);
        }
    }
    for (const h of headings) {
        if (h.text?.trim()) {
            map.set(h.id, true);
        }
    }
    for (const f of footnotes) {
        if (f.text?.trim()) {
            map.set(f.id, true);
        }
    }

    return map;
};

/**
 * Validation error shape from wobble-bibble.
 */
export type ValidationErrorInfo = { type: string; message: string; id?: string };

/**
 * Formats wobble-bibble validation errors into human-readable messages.
 * Uses VALIDATION_ERROR_TYPE_INFO to get detailed descriptions for each error type.
 *
 * @param errors - Array of validation errors from validateTranslationResponse
 * @returns Formatted error messages joined by newlines, or empty string if no errors
 */
export const formatValidationErrors = (errors: ValidationErrorInfo[]): string => {
    if (errors.length === 0) {
        return '';
    }

    return errors
        .map((error) => {
            const errorInfo = VALIDATION_ERROR_TYPE_INFO[error.type as ValidationErrorType];
            const description = errorInfo?.description || error.message;
            return error.id ? `${error.id}: ${description}` : description;
        })
        .join('\n');
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
 * - Flags if translation is suspiciously short compared to Arabic source
 *
 * @param items - Array of excerpts/items to check
 * @returns Array of IDs that have issues
 */
export const findExcerptIssues = (items: ExcerptIssueItem[]): string[] => {
    const issueIds = new Set<string>();

    // Find gaps: consecutive items without translation, surrounded by items with translations
    let i = 0;
    while (i < items.length) {
        const item = items[i];
        const hasText = !!item.text?.trim();

        if (hasText) {
            i++;
            continue;
        }

        // Found an item without translation - count consecutive gaps
        const gapStartIndex = i;
        const gapIds: string[] = [item.id];

        while (i + 1 < items.length && !items[i + 1].text?.trim()) {
            i++;
            gapIds.push(items[i].id);
        }
        const gapEndIndex = i;

        // Check if this gap is surrounded by translated items
        const hasPrevTranslation = gapStartIndex > 0 && !!items[gapStartIndex - 1].text?.trim();
        const hasNextTranslation = gapEndIndex < items.length - 1 && !!items[gapEndIndex + 1].text?.trim();

        // Only flag if surrounded by translations and gap size is within limit
        if (hasPrevTranslation && hasNextTranslation && gapIds.length <= MAX_CONSECUTIVE_GAPS_TO_FLAG) {
            for (const id of gapIds) {
                issueIds.add(id);
            }
        }

        i++;
    }

    // Find truncated translations - only for items that HAVE text
    for (const item of items) {
        if (item.text?.trim()) {
            if (detectTruncatedTranslation(item.nass, item.text)) {
                issueIds.add(item.id);
            }
        }
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
