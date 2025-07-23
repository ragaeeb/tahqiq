import {
    addSpaceBeforeAndAfterPunctuation,
    addSpaceBetweenArabicTextAndNumbers,
    cleanLiteralNewLines,
    cleanMultilines,
    cleanSpacesBeforePeriod,
    condenseAsterisks,
    condenseColons,
    condenseDashes,
    condenseEllipsis,
    condensePeriods,
    condenseUnderscores,
    ensureSpaceBeforeBrackets,
    fixTrailingWow,
    normalizeSlashInReferences,
    normalizeSpaces,
    reduceMultilineBreaksToSingle,
    removeRedundantPunctuation,
    removeSpaceInsideBrackets,
    removeTatwil,
    replaceDoubleBracketsWithArrows,
    replaceEnglishPunctuationWithArabic,
    stripZeroWidthCharacters,
    trimSpaceInsideQuotes,
} from 'bitaboom';
import { isEndingWithPunctuation, type Token } from 'paragrafs';

/**
 * Standardizes standalone Hijri symbol ه to هـ when following Arabic digits
 * @param text - Input text to process
 * @returns Text with standardized Hijri symbols
 */
export const standardizeHijriSymbol = (text: string) => {
    // Replace standalone ه with هـ when it appears after Arabic digits (0-9 or ٠-٩) with up to 1 space in between
    return text.replace(/([0-9\u0660-\u0669])\s?ه(?=\s|$|[^\u0600-\u06FF])/g, '$1 هـ');
};

/**
 * Standardizes standalone اه to اهـ when appearing as whole word
 * @param text - Input text to process
 * @returns Text with standardized AH Hijri symbols
 */
export const standardizeAhHijriSymbol = (text: string) => {
    // Replace standalone اه with اهـ when it appears as a whole word
    // Ensures it's preceded by start/whitespace/non-Arabic AND followed by end/whitespace/non-Arabic
    return text.replace(/(^|\s|[^\u0600-\u06FF])اه(?=\s|$|[^\u0600-\u06FF])/g, '$1اهـ');
};

/**
 * Ensures at most 1 space exists before any word before Arabic quotation marks.
 * Adds a space if there isn't one, or reduces multiple spaces to one.
 * @param {string} text - The input text to modify
 * @returns {string} - The modified text with proper spacing before Arabic quotes
 */
export const ensureSpaceBeforeQuotes = (text: string) => {
    return text.replace(/(\S) *(«[^»]*»)/g, '$1 $2');
};

export const fixMismatchedQuotationMarks = (text: string) => {
    return (
        text
            // Matches mismatched quotation marks: « followed by content and closed with )

            .replace(/«([^»)]+)\)/g, '«$1»')
            // Fix reverse mismatched ( content » to « content »
            .replace(/\(([^()]+)»/g, '«$1»')
            // Matches any unclosed « quotation marks at end of content

            .replace(/«([^»]+)(?=\s*$|$)/g, '«$1»')
    );
};

export const fixCurlyBraces = (text: string) => {
    // Process each mismatch type separately to avoid interference
    let result = text;

    // Fix ( content } to { content }
    result = result.replace(/\(([^(){}]+)\}/g, '{$1}');

    // Fix { content ) to { content }
    return result.replace(/\{([^(){}]+)\)/g, '{$1}');
};

export const fixBracketTypos = (text: string) => {
    return (
        text
            .replace(/\(«|\( \(/g, '«')
            .replace(/»\)|\) \)/g, '»')
            // Fix ")digit)" pattern to "(digit)"
            .replace(/\)([0-9\u0660-\u0669]+)\)/g, '($1)')
            // Fix ")digit(" pattern to "(digit)"
            .replace(/\)([0-9\u0660-\u0669]+)\(/g, '($1)')
    );
};

export const fixUnbalanced = (text: string) => {
    let result = text;

    for (const f of [fixBracketTypos, fixMismatchedQuotationMarks, fixCurlyBraces]) {
        result = f(result);
    }

    return result;
};

const autoCorrectPipeline = [standardizeHijriSymbol, standardizeAhHijriSymbol];

const pastePipeline = [
    stripZeroWidthCharacters,
    cleanSpacesBeforePeriod,
    normalizeSlashInReferences,
    removeSpaceInsideBrackets,
    trimSpaceInsideQuotes,
    replaceEnglishPunctuationWithArabic,
    addSpaceBetweenArabicTextAndNumbers,
    ensureSpaceBeforeBrackets,
    ensureSpaceBeforeQuotes,
    fixTrailingWow,
    removeTatwil,
    condenseColons,
    cleanLiteralNewLines,
    condenseUnderscores,
    condenseDashes,
    condenseAsterisks,
    replaceDoubleBracketsWithArrows,
    condensePeriods,
    condenseEllipsis,
    removeRedundantPunctuation,
    reduceMultilineBreaksToSingle,
    cleanMultilines,
    cleanSpacesBeforePeriod,
    normalizeSlashInReferences,
    addSpaceBeforeAndAfterPunctuation,
    normalizeSpaces,
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
 * Parses page input string into array of page numbers, supporting ranges and lists
 * @param pageInput - Page specification string (e.g., "1-5" or "1,3,5")
 * @returns Array of page numbers
 * @throws Error when start page exceeds end page in range
 */
export const parsePageRanges = (pageInput: string): number[] => {
    if (pageInput.includes('-')) {
        const [start, end] = pageInput.split('-').map(Number);

        if (start > end) {
            throw new Error('Start page cannot be greater than end page');
        }

        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    } else {
        return pageInput.split(',').map(Number);
    }
};

export const removeMarkdownFormatting = (text: string) => {
    return (
        text
            // Remove bold first (**text**) - must come before italics
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            // Remove italics (*text*)
            .replace(/\*([^*]+)\*/g, '$1')
            // Remove headers (# ## ### etc.)
            .replace(/^#+\s*/gm, '')
            // Remove unordered list markers (- * +)
            .replace(/^\s*[-*+]\s+/gm, '')
            // Remove ordered list markers (1. 2. etc.)
            .replace(/^\s*\d+\.\s+/gm, '')
    );
};

export function createSearchRegex(userInput: string): RegExp {
    try {
        // First try as regex
        return new RegExp(userInput, 'i');
    } catch {
        // If invalid regex, escape special chars and treat as literal
        const escaped = userInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(escaped, 'i');
    }
}
