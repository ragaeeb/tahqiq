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
    doubleToSingleBrackets,
    fixTrailingWow,
    normalizeSlashInReferences,
    normalizeSpaces,
    reduceMultilineBreaksToSingle,
    removeSpaceInsideBrackets,
    removeTatwil,
    replaceEnglishPunctuationWithArabic,
    stripZeroWidthCharacters,
} from 'bitaboom';

const pastePipeline = [
    stripZeroWidthCharacters,
    removeSpaceInsideBrackets,
    replaceEnglishPunctuationWithArabic,
    addSpaceBetweenArabicTextAndNumbers,
    fixTrailingWow,
    removeTatwil,
    condenseColons,
    cleanLiteralNewLines,
    condenseUnderscores,
    condenseDashes,
    condenseAsterisks,
    doubleToSingleBrackets,
    condensePeriods,
    condenseEllipsis,
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
