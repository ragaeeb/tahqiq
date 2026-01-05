import { sanitizeArabic, standardizeHijriSymbol, standardizeIntahaSymbol } from 'baburchi';
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
    ensureSpaceBeforeQuotes,
    fixBracketTypos,
    fixCurlyBraces,
    fixMismatchedQuotationMarks,
    fixTrailingWow,
    normalizeSlashInReferences,
    normalizeSpaces,
    reduceMultilineBreaksToSingle,
    removeRedundantPunctuation,
    removeSpaceInsideBrackets,
    replaceDoubleBracketsWithArrows,
    replaceEnglishPunctuationWithArabic,
    trimSpaceInsideQuotes,
} from 'bitaboom';
import { isEndingWithPunctuation, type Token } from 'paragrafs';

export const fixUnbalanced = (text: string) => {
    let result = text;

    for (const f of [fixBracketTypos, fixMismatchedQuotationMarks, fixCurlyBraces]) {
        result = f(result);
    }

    return result;
};

/**
 * Removes Tatweel (kashida) character from Arabic text safely.
 * Tatweel (U+0640, ـ) is a typographic elongation used in Arabic script.
 * @param text - Input Arabic text
 * @returns Text without Tatweel characters
 */
export const stripTatweelSafe = (text: string) => {
    return text.replace(/\u0640/g, '');
};

const autoCorrectPipeline = [standardizeHijriSymbol, standardizeIntahaSymbol];

const pastePipeline = [
    (text: string) => sanitizeArabic(text, { base: 'none', stripTatweel: true, stripZeroWidth: true }),
    cleanSpacesBeforePeriod,
    normalizeSlashInReferences,
    removeSpaceInsideBrackets,
    trimSpaceInsideQuotes,
    replaceEnglishPunctuationWithArabic,
    addSpaceBetweenArabicTextAndNumbers,
    ensureSpaceBeforeBrackets,
    ensureSpaceBeforeQuotes,
    fixTrailingWow,
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
