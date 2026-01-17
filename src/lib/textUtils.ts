import { sanitizeArabic, standardizeHijriSymbol, standardizeIntahaSymbol } from 'baburchi';
import {
    estimateTokenCount,
    fixBracketTypos,
    fixCurlyBraces,
    fixMismatchedQuotationMarks,
    preformatArabicText as preformatBitaboom,
} from 'bitaboom';
import { isEndingWithPunctuation, type Token } from 'paragrafs';
import type { TextLine } from '@/stores/manuscriptStore/types';

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
};

/**
 * Overhead tokens per item (for "ID - " prefix and newlines in formatted output)
 */
const TOKENS_OVERHEAD_PER_ITEM = 5;

/**
 * Finds the last index in items array where cumulative token count stays under the limit.
 * Useful for determining how many items can be selected before exceeding a token budget.
 *
 * @param items - Array of items with text content
 * @param getText - Function to extract text from each item for token counting
 * @param tokenLimit - Maximum token count allowed
 * @param baseTokens - Base tokens to start with (e.g., prompt tokens)
 * @returns Last valid index (0-based), or -1 if even the first item exceeds the limit
 */
export const findLastIndexUnderTokenLimit = <T>(
    items: T[],
    getText: (item: T) => string,
    tokenLimit: number,
    baseTokens = 0,
): number => {
    if (items.length === 0) {
        return -1;
    }

    let cumulative = baseTokens;
    let lastValidIndex = -1;

    for (let i = 0; i < items.length; i++) {
        const text = getText(items[i]);
        const itemTokens = estimateTokenCount(text) + TOKENS_OVERHEAD_PER_ITEM;
        cumulative += itemTokens;

        if (cumulative <= tokenLimit) {
            lastValidIndex = i;
        } else {
            // Once we exceed, no point continuing
            break;
        }
    }

    return lastValidIndex;
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
export const mapTextLineToMarkdown = (o: TextLine): TextLine => {
    const text = o.isHeading ? `#${o.text}` : o.text;
    return { ...o, text };
};
