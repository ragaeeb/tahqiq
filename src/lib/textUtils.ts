import { sanitizeArabic, standardizeHijriSymbol, standardizeIntahaSymbol } from 'baburchi';
import {
    fixBracketTypos,
    fixCurlyBraces,
    fixMismatchedQuotationMarks,
    preformatArabicText as preformatBitaboom,
} from 'bitaboom';
import { isEndingWithPunctuation, type Token } from 'paragrafs';
import { MARKER_ID_PATTERN, TRANSLATION_MARKER_PARTS } from './constants';

export const fixUnbalanced = (text: string) => {
    let result = text;

    for (const f of [fixBracketTypos, fixMismatchedQuotationMarks, fixCurlyBraces]) {
        result = f(result);
    }

    return result;
};

const autoCorrectPipeline = [standardizeHijriSymbol, standardizeIntahaSymbol];

const pastePipeline = [
    (text: string) => sanitizeArabic(text, { base: 'none', stripTatweel: true, stripZeroWidth: true }),
    preformatBitaboom,
];

/**
 * Applies text formatting pipeline with optional auto-correction
 * @param text - Input text to format
 * @param autoCorrect - Whether to apply auto-correction transformations
 * @returns Formatted Arabic text
 */
export const preformatArabicText = (text: string, autoCorrect = false) => {
    let result = text;
    const pipeline = [...pastePipeline];

    if (autoCorrect) {
        pipeline.push(...autoCorrectPipeline);
    }

    pipeline.forEach((func) => {
        result = func(result);
    });

    return result.trim();
};

/**
 * Finds first token matching the beginning of selected text
 * @param tokens - Array of tokenized text objects
 * @param selectedText - Text selection to match against tokens
 * @returns First matching token or null if not found
 */
export const findFirstTokenForText = (tokens: Token[], selectedText: string) => {
    // Split the selectedText into individual words
    const selectedWords = selectedText.split(' ');
    const words = tokens.map((w) => {
        if (isEndingWithPunctuation(w.text)) {
            return { ...w, text: w.text.slice(0, -1) };
        }

        return w;
    });

    // Iterate over the words array
    for (let i = 0; i < words.length; i++) {
        // Check if the current word in the words array matches the first word in selectedWords
        if (words[i]!.text === selectedWords[0]) {
            // Check consecutive words in the words array to see if they match the consecutive words in selectedWords
            let allMatch = true;
            for (let j = 1; j < selectedWords.length; j++) {
                if (i + j >= words.length || words[i + j]!.text !== selectedWords[j]) {
                    allMatch = false;
                    break;
                }
            }

            // If all consecutive words match, return the first matching word object
            if (allMatch) {
                return tokens[i]!;
            }
        }
    }

    // Return null if no matching starting word is found
    return null;
}; /**
 * Counts words in text by splitting on whitespace.
 * Works for both Arabic and English text.
 *
 * @param text - The text to count words in
 * @returns Number of words in the text
 */

export const countWords = (text: string) => {
    if (!text) {
        return 0;
    }
    return text.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * Arabic-aware token estimation
 * Categories:
 * - Arabic diacritics (tashkeel U+064B-U+0652, U+0670): ~1 diacritic/token
 * - Tatweel (U+0640): ~1 per token (elongation character)
 * - Arabic-Indic numerals (U+0660-U+0669, U+06F0-U+06F9): ~4 chars/token
 * - Arabic base characters: ~2.5 chars/token
 * - Latin/punctuation/whitespace: ~4 chars/token
 */

export const estimateTokenCount = (text: string) => {
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
            otherCount / 4,
    );
}; /**
 * Parses bulk translation text into a Map for efficient O(1) lookup.
 * Handles multi-line translations where subsequent lines without markers belong to the previous entry.
 *
 * @param rawText - Raw text containing translations in format "ID - Translation text"
 * @returns ParseTranslationsResult with a Map for O(1) lookup and count
 */

export const parseTranslations = (rawText: string) => {
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

/**
 * Parses a single translation line and extracts the ID and text
 * @param line - String line to process
 * @returns Parsed translation with ID and text, or null if not a valid translation line
 */
export const parseTranslationLine = (line: string) => {
    const { dashes, optionalSpace } = TRANSLATION_MARKER_PARTS;
    const pattern = new RegExp(`^(${MARKER_ID_PATTERN})${optionalSpace}${dashes}(.*)$`);
    const match = line.match(pattern);

    const [, id, text] = match || [];
    return text ? { id, text: text.trim() } : null;
};

export const splitLines = (value: string) => value.split('\n').map((s) => s.trimEnd());

/**
 * Extracts book ID from a ketabonline.com URL.
 * Supports formats like:
 * - https://ketabonline.com/ar/books/2122
 * - https://ketabonline.com/en/books/2122
 * - ketabonline.com/ar/books/2122
 */
export const extractKetabBookIdFromUrl = (url: string) => {
    // Match /books/{id} pattern
    const [, id] = url.match(/\/books\/(\d+)/i) || [];

    if (id) {
        return parseInt(id, 10);
    }

    // Also try just a plain number
    const [, plainNumber] = url.trim().match(/^(\d+)$/) || [];

    if (plainNumber) {
        return parseInt(plainNumber, 10);
    }

    return null;
};
