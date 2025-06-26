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

const fixBracketTypos = (text: string) => {
    return text.replace(/\(«|\( \(/g, '«').replace(/»\)|\) \)/g, '»');
};

const autoCorrectPipeline = [standardizeHijriSymbol, standardizeAhHijriSymbol, fixBracketTypos];

const pastePipeline = [
    stripZeroWidthCharacters,
    cleanSpacesBeforePeriod,
    normalizeSlashInReferences,
    removeSpaceInsideBrackets,
    replaceEnglishPunctuationWithArabic,
    addSpaceBetweenArabicTextAndNumbers,
    ensureSpaceBeforeBrackets,
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

    return result;
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
