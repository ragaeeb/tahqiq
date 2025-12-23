import { sanitizeArabic } from 'baburchi';
import { preformatArabicText } from 'bitaboom';
import { type Page, type Segment, type SegmentationOptions, segmentPages } from 'flappa-doormal';
import { convertContentToMarkdown, mapPageCharacterContent, type Title } from 'shamela';
import type { Excerpt, Excerpts, ExcerptType, Heading, IndexedExcerpt } from '@/stores/excerptsStore/types';
import type { ShamelaPage } from '@/stores/shamelaStore/types';
import { LatestContractVersion } from '../constants';

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
    };
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
