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

export const standardizeHijriSymbol = (text: string) => {
    // Replace standalone ه with هـ when it appears after Arabic digits (0-9 or ٠-٩) with up to 1 space in between
    return text.replace(/([0-9\u0660-\u0669])\s?ه(?=\s|$|[^\u0600-\u06FF])/g, '$1 هـ');
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
    replaceDoubleBracketsWithArrows,
    condensePeriods,
    condenseEllipsis,
    removeRedundantPunctuation,
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
