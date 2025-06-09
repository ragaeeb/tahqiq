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
    fixTrailingWow,
    normalizeSlashInReferences,
    normalizeSpaces,
    reduceMultilineBreaksToSingle,
    removeSpaceInsideBrackets,
    removeTatwil,
    replaceEnglishPunctuationWithArabic,
    stripZeroWidthCharacters,
} from 'bitaboom';
import { isEndingWithPunctuation, type Token } from 'paragrafs';

export const standardizeHijriSymbol = (text: string) => {
    // Replace standalone ه with هـ when it appears after Arabic digits (0-9 or ٠-٩) with up to 1 space in between
    return text.replace(/([0-9\u0660-\u0669])\s?ه(?=\s|$|[^\u0600-\u06FF])/g, '$1 هـ');
};

export const replaceDoubleBrackets = (text: string) => {
    return text.replace(/\(\(\s?/g, '«').replace(/\s?\)\)/g, '»');
};

const replaceQuestionAndPeriod = (text: string) => {
    return text.replace(/([؟!])[.،]/g, '$1');
};

/**
 * Ensures at most 1 space exists before any word before brackets.
 * Adds a space if there isn't one, or reduces multiple spaces to one.
 * @param {string} text - The input text to modify
 * @returns {string} - The modified text with proper spacing before brackets
 */
export const ensureSpaceBeforeBrackets = (text: string): string => {
    return (
        text
            .replace(/(\S) {2,}(\([^)]*\))/g, '$1 $2') // Multiple spaces to one
            // eslint-disable-next-line sonarjs/slow-regex
            .replace(/(\S)(\([^)]*\))/g, '$1 $2')
    ); // Add space if missing
};

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
    replaceDoubleBrackets,
    condensePeriods,
    condenseEllipsis,
    replaceQuestionAndPeriod,
    standardizeHijriSymbol,
    reduceMultilineBreaksToSingle,
    cleanMultilines,
    cleanSpacesBeforePeriod,
    normalizeSlashInReferences,
    addSpaceBeforeAndAfterPunctuation,
    normalizeSpaces,
];

export const preformatArabicText = (text: string) => {
    let result = text;

    pastePipeline.forEach((func) => {
        result = func(result);
    });

    return result;
};

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

export const areQuotesBalanced = (str: string): boolean => {
    let quoteCount = 0;
    for (const char of str) {
        if (char === '"') {
            quoteCount++;
        }
    }
    return quoteCount % 2 === 0;
};

const brackets = { '(': ')', '[': ']', '{': '}' };
const openBrackets = new Set(['(', '[', '{']);
const closeBrackets = new Set([')', ']', '}']);

export const areBracketsBalanced = (str: string): boolean => {
    const stack: string[] = [];

    for (const char of str) {
        if (openBrackets.has(char)) {
            stack.push(char);
        } else if (closeBrackets.has(char)) {
            const lastOpen = stack.pop();
            if (!lastOpen || brackets[lastOpen as keyof typeof brackets] !== char) {
                return false;
            }
        }
    }

    return stack.length === 0;
};

export const isBalanced = (str: string): boolean => {
    return areQuotesBalanced(str) && areBracketsBalanced(str);
};
