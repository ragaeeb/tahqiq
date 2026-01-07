import { sanitizeArabic } from 'baburchi';
import { preformatArabicText } from 'bitaboom';
import { type Page, type Segment, type SegmentationOptions, segmentPages } from 'flappa-doormal';
import { convertContentToMarkdown, mapPageCharacterContent, type Title } from 'shamela';
import { LatestContractVersion, TRANSLATE_EXCERPTS_PROMPT } from '@/lib/constants';
import type { Excerpt, Excerpts, ExcerptType, Heading, IndexedExcerpt } from '@/stores/excerptsStore/types';
import type { ShamelaPage } from '@/stores/shamelaStore/types';

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

const getIndexedShamelaPages = (shamelaPages: ShamelaPage[]) => {
    const pages: Page[] = [];
    const idToPage = new Map<number, ShamelaPage>();

    for (const page of shamelaPages) {
        idToPage.set(page.id, page);

        let content = mapPageCharacterContent(page.body, { 舄: '' });
        content = convertContentToMarkdown(content);

        pages.push({ content, id: page.id });
    }

    return { idToPage, pages };
};

const segmentAndSanitize = (shamelaPages: ShamelaPage[], options: SegmentationOptions) => {
    const { pages, idToPage } = getIndexedShamelaPages(shamelaPages);

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

export const segmentShamelaPagesToExcerpts = (
    shamelaPages: ShamelaPage[],
    titles: Title[],
    options: SegmentationOptions,
): Excerpts => {
    const { segments, idToPage } = segmentAndSanitize(shamelaPages, options);

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
            nass: s.content,
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
        options,
        promptForTranslation: TRANSLATE_EXCERPTS_PROMPT.join('\n'),
    };
};

/**
 * Converts pre-segmented data to Excerpts payload.
 * Used when segments have been post-processed (e.g., merged short segments).
 */
export const segmentsToExcerpts = (segments: Segment[], options: SegmentationOptions): Excerpts => {
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
        headings: [] as Heading[],
        lastUpdatedAt: Date.now() / 1000,
        options,
        promptForTranslation: TRANSLATE_EXCERPTS_PROMPT.join('\n'),
    };
};

/**
 * Generic segmentation to Excerpts payload from already-prepared flappa `Page[]`.
 * Used by the shared segmentation panel (Ketab/Shamela/etc.) when we only have `{id, content}` pages.
 */
export const segmentFlappaPagesToExcerpts = (pages: Page[], options: SegmentationOptions): Excerpts => {
    const segments = segmentPages(pages, options);
    return segmentsToExcerpts(segments, options);
};

// ============================================================================
// Translation Parsing Utilities
// ============================================================================

/**
 * Components for building translation marker regex patterns
 */
export const TRANSLATION_MARKER_PARTS = {
    /** Dash variations (hyphen, en dash, em dash) */
    dashes: '[-–—]',
    /** Numeric portion of the reference */
    digits: '\\d+',
    /** Valid marker prefixes (Book, Chapter, Footnote, Translation, Page) */
    markers: '[BCFTPN]',
    /** Optional whitespace before dash */
    optionalSpace: '\\s?',
    /** Valid single-letter suffixes */
    suffix: '[a-z]',
};

export const MARKER_ID_PATTERN = `${TRANSLATION_MARKER_PARTS.markers}${TRANSLATION_MARKER_PARTS.digits}${TRANSLATION_MARKER_PARTS.suffix}?`;

export type ParsedTranslation = { id: string; text: string };

/**
 * Result of parsing bulk translations
 */
export type ParseTranslationsResult = {
    /** Map of ID to translation text for O(1) lookup */
    translationMap: Map<string, string>;
    /** Total number of translations parsed */
    count: number;
};

/**
 * Parses a single translation line and extracts the ID and text
 * @param line - String line to process
 * @returns Parsed translation with ID and text, or null if not a valid translation line
 */
export const parseTranslationLine = (line: string): ParsedTranslation | null => {
    const { dashes, optionalSpace } = TRANSLATION_MARKER_PARTS;
    const pattern = new RegExp(`^(${MARKER_ID_PATTERN})${optionalSpace}${dashes}(.*)$`);
    const match = line.match(pattern);

    if (match?.[2]) {
        const [, id, text] = match;
        return { id, text: text.trim() };
    }

    return null;
};

/**
 * Parses bulk translation text into a Map for efficient O(1) lookup.
 * Handles multi-line translations where subsequent lines without markers belong to the previous entry.
 *
 * @param rawText - Raw text containing translations in format "ID - Translation text"
 * @returns ParseTranslationsResult with a Map for O(1) lookup and count
 */
export const parseTranslations = (rawText: string): ParseTranslationsResult => {
    const translationMap = new Map<string, string>();
    const lines = rawText.split('\n');
    let currentId: string | null = null;

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip empty lines
        if (!trimmedLine) {
            continue;
        }

        // Try to parse as a new translation entry
        const parsed = parseTranslationLine(trimmedLine);

        if (parsed) {
            // New translation entry
            currentId = parsed.id;
            translationMap.set(currentId, parsed.text);
        } else if (currentId) {
            // Continuation of previous translation - append with newline
            const existing = translationMap.get(currentId)!;
            translationMap.set(currentId, `${existing}\n${trimmedLine}`);
        }
        // Lines before first valid translation are ignored
    }

    return { count: translationMap.size, translationMap };
};

// ============================================================================
// Translation Dialog Utilities
// ============================================================================

/**
 * Arabic-aware token estimation
 * Categories:
 * - Arabic diacritics (tashkeel U+064B-U+0652, U+0670): ~1 diacritic/token
 * - Tatweel (U+0640): ~1 per token (elongation character)
 * - Arabic-Indic numerals (U+0660-U+0669, U+06F0-U+06F9): ~4 chars/token
 * - Arabic base characters: ~2.5 chars/token
 * - Latin/punctuation/whitespace: ~4 chars/token
 */
export const estimateTokenCount = (text: string): number => {
    if (!text) {
        return 0;
    }

    // Arabic diacritics (tashkeel)
    const diacriticCount = (text.match(/[\u064B-\u0652\u0670]/g) || []).length;

    // Tatweel (kashida elongation)
    const tatweelCount = (text.match(/\u0640/g) || []).length;

    // Arabic-Indic numerals (both forms)
    const arabicNumeralCount = (text.match(/[\u0660-\u0669\u06F0-\u06F9]/g) || []).length;

    // Arabic base characters (excluding diacritics, tatweel, numerals)
    const arabicBaseCount = (text.match(/[\u0600-\u063F\u0641-\u064A\u0653-\u065F\u0671-\u06EF]/g) || []).length;

    // Everything else (Latin, punctuation, Western numerals, whitespace)
    const otherCount = text.length - diacriticCount - tatweelCount - arabicNumeralCount - arabicBaseCount;

    // Estimate tokens
    return Math.ceil(
        diacriticCount + // ~1 token each
            tatweelCount + // ~1 token each
            arabicNumeralCount / 4 + // ~4 chars/token
            arabicBaseCount / 2.5 + // ~2.5 chars/token
            otherCount / 4, // ~4 chars/token
    );
};

/**
 * Format excerpts for LLM prompt (matches handleExportToTxt format)
 */
export const formatExcerptsForPrompt = (excerpts: Excerpt[], prompt: string): string => {
    const formatted = excerpts.map((e) => `${e.id} - ${e.nass}`).join('\n\n');
    return [prompt, formatted].join('\n\n\n');
};

/**
 * Get untranslated excerpt IDs not in the "sent" set
 */
export const getUntranslatedIds = (excerpts: Excerpt[], sentIds: Set<string>): string[] => {
    return excerpts.filter((e) => !e.text && !sentIds.has(e.id)).map((e) => e.id);
};
