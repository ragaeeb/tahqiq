import { MARKER_ID_PATTERN, TRANSLATION_MARKER_PARTS } from './constants';

/**
 * Result of translation validation
 */
export type TranslationValidationResult = {
    /** Whether validation passed */
    isValid: boolean;
    /** Error message if validation failed */
    error?: string;
    /** Normalized/fixed text (with merged markers split onto separate lines) */
    normalizedText: string;
    /** List of parsed translation IDs in order */
    parsedIds: string[];
};

/**
 * Validates translation marker format and returns error message if invalid.
 * Catches common AI hallucinations like malformed reference IDs.
 *
 * @param text - Raw translation text to validate
 * @returns Error message if invalid, undefined if valid
 */
export const validateTranslationMarkers = (text: string): string | undefined => {
    const { markers, digits, suffix, dashes, optionalSpace } = TRANSLATION_MARKER_PARTS;

    // Check for invalid reference format (with dash but wrong structure)
    // This catches cases like B12a34 -, P1x2y3 -, P2247$2 -, etc.
    // Requires at least one digit after the marker to be considered a potential reference
    const invalidRefPattern = new RegExp(
        `^${markers}(?=${digits})(?=.*${dashes})(?!${digits}${suffix}*${optionalSpace}${dashes})[^\\s-–—]+${optionalSpace}${dashes}`,
        'm',
    );
    const invalidRef = text.match(invalidRefPattern);

    if (invalidRef) {
        return `Invalid reference format "${invalidRef[0].trim()}" - expected format is letter + numbers + optional suffix (a-j) + dash`;
    }

    // Check for space before reference with multi-letter suffix (e.g., " P123ab -")
    const spaceBeforePattern = new RegExp(` ${markers}${digits}${suffix}+${optionalSpace}${dashes}`, 'm');

    // Check for reference with single letter suffix but no dash after (e.g., "P123a without")
    const suffixNoDashPattern = new RegExp(`^${markers}${digits}${suffix}(?! ${dashes})`, 'm');

    const match = text.match(spaceBeforePattern) || text.match(suffixNoDashPattern);

    if (match) {
        return `Suspicious reference found: "${match[0]}"`;
    }

    // Check for references with dash but no content after (e.g., "P123 -")
    const emptyAfterDashPattern = new RegExp(`^${MARKER_ID_PATTERN}${optionalSpace}${dashes}\\s*$`, 'm');
    const emptyAfterDash = text.match(emptyAfterDashPattern);

    if (emptyAfterDash) {
        return `Reference "${emptyAfterDash[0].trim()}" has dash but no content after it`;
    }

    // Check for $ character in references (invalid format like B1234$5)
    const dollarSignPattern = new RegExp(`^${markers}${digits}\\$${digits}`, 'm');
    const dollarSignRef = text.match(dollarSignPattern);

    if (dollarSignRef) {
        return `Invalid reference format "${dollarSignRef[0]}" - contains $ character`;
    }
};

/**
 * Normalizes translation text by splitting merged markers onto separate lines.
 * LLMs sometimes put multiple translations on the same line.
 *
 * @param content - Raw translation text
 * @returns Normalized text with each marker on its own line
 */
export const normalizeTranslationText = (content: string): string => {
    // First normalize line endings: CRLF -> LF, CR -> LF
    const normalizedLineEndings = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Match markers that appear after a space
    const mergedMarkerWithSpacePattern = new RegExp(
        ` (${MARKER_ID_PATTERN}${TRANSLATION_MARKER_PARTS.optionalSpace}${TRANSLATION_MARKER_PARTS.dashes})`,
        'gm',
    );

    // Match markers that appear directly after non-whitespace (e.g., ".P6822 -" or "?P6823 -")
    // Capture the preceding character to preserve it, then add newline before the marker
    const mergedMarkerNoSpacePattern = new RegExp(
        `([^\\s\\n])(${MARKER_ID_PATTERN}${TRANSLATION_MARKER_PARTS.optionalSpace}${TRANSLATION_MARKER_PARTS.dashes})`,
        'gm',
    );

    return normalizedLineEndings
        .replace(mergedMarkerWithSpacePattern, '\n$1')
        .replace(mergedMarkerNoSpacePattern, '$1\n$2')
        .replace(/\\\[/gm, '[');
};

/**
 * Extracts translation IDs from text in order of appearance.
 *
 * @param text - Translation text
 * @returns Array of IDs in order
 */
export const extractTranslationIds = (text: string): string[] => {
    const { dashes, optionalSpace } = TRANSLATION_MARKER_PARTS;
    const pattern = new RegExp(`^(${MARKER_ID_PATTERN})${optionalSpace}${dashes}`, 'gm');
    const ids: string[] = [];

    for (const match of text.matchAll(pattern)) {
        ids.push(match[1]);
    }

    return ids;
};

/**
 * Extracts the numeric portion from an excerpt ID.
 * E.g., "P11622a" -> 11622, "C123" -> 123, "B45b" -> 45
 *
 * @param id - Excerpt ID
 * @returns Numeric portion of the ID
 */
export const extractIdNumber = (id: string): number => {
    const match = id.match(/\d+/);
    return match ? Number.parseInt(match[0], 10) : 0;
};

/**
 * Extracts the prefix (type) from an excerpt ID.
 * E.g., "P11622a" -> "P", "C123" -> "C", "B45" -> "B"
 *
 * @param id - Excerpt ID
 * @returns Single character prefix
 */
export const extractIdPrefix = (id: string): string => {
    return id.charAt(0);
};

/**
 * Validates that translation IDs appear in ascending numeric order within the same prefix type.
 * This catches LLM errors where translations are output in wrong order (e.g., P12659 before P12651).
 *
 * @param translationIds - IDs from pasted translations
 * @returns Error message if order issue detected, undefined if valid
 */
export const validateNumericOrder = (translationIds: string[]): string | undefined => {
    if (translationIds.length < 2) {
        return;
    }

    // Track last seen number for each prefix type
    const lastNumberByPrefix = new Map<string, { id: string; num: number }>();

    for (const id of translationIds) {
        const prefix = extractIdPrefix(id);
        const num = extractIdNumber(id);

        const last = lastNumberByPrefix.get(prefix);

        if (last && num < last.num) {
            // Out of numeric order within the same prefix type
            return `Numeric order error: "${id}" (${num}) appears after "${last.id}" (${last.num}) but should come before it`;
        }

        lastNumberByPrefix.set(prefix, { id, num });
    }
};

/**
 * Validates translation order against expected excerpt order from the store.
 * Allows pasting in multiple blocks where each block is internally ordered.
 * Resets (position going backwards) are allowed between blocks.
 * Errors only when there's disorder WITHIN a block (going backwards then forwards).
 *
 * @param translationIds - IDs from pasted translations
 * @param expectedIds - IDs from store excerpts/headings/footnotes in order
 * @returns Error message if order issue detected, undefined if valid
 */
export const validateTranslationOrder = (translationIds: string[], expectedIds: string[]): string | undefined => {
    if (translationIds.length === 0 || expectedIds.length === 0) {
        return;
    }

    // Build a map of expected ID positions for O(1) lookup
    const expectedPositions = new Map<string, number>();
    for (let i = 0; i < expectedIds.length; i++) {
        expectedPositions.set(expectedIds[i], i);
    }

    // Track position within current block
    // When position goes backwards, we start a new block
    // Error only if we go backwards THEN forwards within the same conceptual sequence
    let lastExpectedPosition = -1;
    let blockStartPosition = -1;
    let lastFoundId: string | null = null;

    for (const translationId of translationIds) {
        const expectedPosition = expectedPositions.get(translationId);

        if (expectedPosition === undefined) {
            // ID not found in expected list - skip
            continue;
        }

        if (lastFoundId !== null) {
            if (expectedPosition < lastExpectedPosition) {
                // Reset detected - starting a new block
                // This is allowed, just track the new block's start
                blockStartPosition = expectedPosition;
            } else if (expectedPosition < blockStartPosition && blockStartPosition !== -1) {
                // Within the current block, we went backwards - this is an error
                // This catches: A, B, C (block 1), D, E, C (error: C < E but we're in block starting at D)
                return `Order error: "${translationId}" appears after "${lastFoundId}" but comes before it in the excerpts. This suggests a duplicate or misplaced translation.`;
            }
        } else {
            blockStartPosition = expectedPosition;
        }

        lastExpectedPosition = expectedPosition;
        lastFoundId = translationId;
    }
};

/**
 * Performs comprehensive validation on translation text.
 * Validates markers, normalizes text, and checks order against expected IDs.
 *
 * @param rawText - Raw translation text from user input
 * @param expectedIds - Expected IDs from store (excerpts + headings + footnotes)
 * @returns Validation result with normalized text and any errors
 */
export const validateTranslations = (rawText: string, expectedIds: string[]): TranslationValidationResult => {
    // First normalize the text (split merged markers)
    const normalizedText = normalizeTranslationText(rawText);

    // Validate marker formats
    const markerError = validateTranslationMarkers(normalizedText);
    if (markerError) {
        return { error: markerError, isValid: false, normalizedText, parsedIds: [] };
    }

    // Extract IDs from normalized text
    const parsedIds = extractTranslationIds(normalizedText);

    if (parsedIds.length === 0) {
        return { error: 'No valid translation markers found', isValid: false, normalizedText, parsedIds: [] };
    }

    // Validate order against expected IDs
    const orderError = validateTranslationOrder(parsedIds, expectedIds);
    if (orderError) {
        return { error: orderError, isValid: false, normalizedText, parsedIds };
    }

    return { isValid: true, normalizedText, parsedIds };
};

/**
 * Finds translation IDs that don't exist in the expected store IDs.
 * Used to validate that all pasted translations can be matched before committing.
 *
 * @param translationIds - IDs from parsed translations
 * @param expectedIds - IDs from store (excerpts + headings + footnotes)
 * @returns Array of IDs that exist in translations but not in the store
 */
export const findUnmatchedTranslationIds = (translationIds: string[], expectedIds: string[]): string[] => {
    const expectedSet = new Set(expectedIds);
    return translationIds.filter((id) => !expectedSet.has(id));
};

/**
 * Minimum Arabic text length (in characters) to consider for truncation detection.
 * Short texts are exempt to avoid false positives on single-word or brief phrases.
 */
const MIN_ARABIC_LENGTH_FOR_TRUNCATION_CHECK = 50;

/**
 * Minimum expected translation ratio (translation length / Arabic length).
 * English translations typically expand from Arabic, but this is a floor
 * to catch extreme truncation. A ratio below this threshold is suspicious.
 *
 * Example: Arabic 100 chars, English should be at least 20 chars (0.2 ratio).
 * This is deliberately low to only catch obvious truncations.
 */
const MIN_TRANSLATION_RATIO = 0.15;

/**
 * Detects when a translation appears truncated compared to its Arabic source.
 * This catches LLM errors where only a portion of the text was translated.
 *
 * @param arabicText - The original Arabic text (nass)
 * @param translationText - The English translation (text)
 * @returns Error message if truncation detected, undefined if valid
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
 * Represents an item with text fields for gap/issue detection.
 */
export type TextItem = { id: string; nass?: string | null; text?: string | null };

/**
 * Finds all excerpts with issues: gaps (missing translations surrounded by translations)
 * and truncated translations (suspiciously short compared to Arabic source).
 *
 * @param items - Array of excerpts/items to check
 * @returns Array of IDs that have issues
 */
export const findExcerptIssues = (items: TextItem[]): string[] => {
    const issueIds = new Set<string>();

    // Find gaps: items without translation surrounded by items with translations
    for (let i = 1; i < items.length - 1; i++) {
        const prev = items[i - 1];
        const curr = items[i];
        const next = items[i + 1];

        if (prev.text?.trim() && !curr.text?.trim() && next.text?.trim()) {
            issueIds.add(curr.id);
        }
    }

    // Find truncated translations
    for (const item of items) {
        if (detectTruncatedTranslation(item.nass, item.text)) {
            issueIds.add(item.id);
        }
    }

    return Array.from(issueIds);
};
