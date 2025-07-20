import { isEndingWithPunctuation } from 'paragrafs';

import type { Page } from '@/stores/bookStore/types';

/**
 * Regular expression pattern for Arabic punctuation marks.
 * Includes: period (.), exclamation mark (!), question mark (?),
 * Arabic question mark (؟), and Arabic semicolon (؛).
 */
const ARABIC_STOP_PUNCTUATION = /[.!?؟؛…]/;

const TOKENS_PER_CHARACTER = 3.5; // Arabic has more tokens since it's more dense

/**
 * Configuration options for text translation processing.
 */
type TranslationOptions = {
    /** Maximum number of tokens allowed per translation batch to stay within AI model limits */
    maxTokens?: number;
};

/**
 * Finds the first punctuation mark in a text and returns the index
 */
const findFirstPunctuation = (text: string): number => {
    for (let i = 0; i < text.length; i++) {
        if (ARABIC_STOP_PUNCTUATION.test(text[i])) {
            return i;
        }
    }
    return -1; // No punctuation found
};

/**
 * Creates a segment from text and page range
 */
const createSegment = (
    text: string,
    startPageIndex: number,
    endPageIndex: number,
    pages: Page[],
    prefixGenerator: (page: Page) => string,
): string => {
    const prefix =
        startPageIndex === endPageIndex
            ? prefixGenerator(pages[startPageIndex])
            : `${prefixGenerator(pages[startPageIndex])}_${pages[endPageIndex].page}`;
    return `${prefix}\n${text}`;
};

/**
 * Searches for first punctuation across pages and returns concatenated text with split info
 */
const findAndConcatenateUntilPunctuation = (
    pages: Page[],
    startIndex: number,
    initialText: string,
    textExtractor: (page: Page) => string,
): {
    concatenatedText: string;
    endPageIndex: number;
    found: boolean;
    remainingText: string;
} => {
    let concatenatedText = initialText;
    let searchPageIndex = startIndex + 1;

    while (searchPageIndex < pages.length) {
        const searchPageText = textExtractor(pages[searchPageIndex]);
        const punctuationIndex = findFirstPunctuation(searchPageText);

        if (punctuationIndex >= 0) {
            const beforePunctuation = searchPageText.substring(0, punctuationIndex + 1);
            const afterPunctuation = searchPageText.substring(punctuationIndex + 1).trim();

            return {
                concatenatedText: concatenatedText + ' ' + beforePunctuation,
                endPageIndex: searchPageIndex,
                found: true,
                remainingText: afterPunctuation,
            };
        }

        concatenatedText += ' ' + searchPageText;
        searchPageIndex++;
    }

    return {
        concatenatedText,
        endPageIndex: pages.length - 1,
        found: false,
        remainingText: '',
    };
};

/**
 * Processes a single segment when text doesn't end with punctuation
 */
const processMultiPageSegment = (
    pages: Page[],
    startPageIndex: number,
    initialText: string,
    textExtractor: (page: Page) => string,
    prefixGenerator: (page: Page) => string,
): {
    nextPageIndex: number;
    remainingText: string;
    segment: string;
} => {
    const result = findAndConcatenateUntilPunctuation(pages, startPageIndex, initialText, textExtractor);
    const segment = createSegment(result.concatenatedText, startPageIndex, result.endPageIndex, pages, prefixGenerator);

    const nextPageIndex = result.remainingText ? result.endPageIndex : result.endPageIndex + 1;

    return {
        nextPageIndex,
        remainingText: result.remainingText,
        segment,
    };
};

/**
 * Processes text segments, cutting at the first punctuation mark found when pages don't end with punctuation
 */
const processTextSegments = (
    pages: Page[],
    textExtractor: (page: Page) => string,
    prefixGenerator: (page: Page) => string,
): string[] => {
    if (!pages.length) return [];

    const segments: string[] = [];
    let currentPageIndex = 0;
    let remainingText = '';

    while (currentPageIndex < pages.length) {
        const currentPage = pages[currentPageIndex];
        const currentText = remainingText || textExtractor(currentPage);
        remainingText = '';

        if (isEndingWithPunctuation(currentText)) {
            segments.push(`${prefixGenerator(currentPage)}\n${currentText}`);
            currentPageIndex++;
        } else {
            const result = processMultiPageSegment(
                pages,
                currentPageIndex,
                currentText,
                textExtractor,
                prefixGenerator,
            );
            segments.push(result.segment);
            currentPageIndex = result.nextPageIndex;
            remainingText = result.remainingText;

            if (currentPageIndex >= pages.length) break;
        }
    }

    return segments;
};

/**
 * Splits text segments into batches based on token limits
 */
const splitIntoTokenBatches = (segments: string[], maxTokens: number): string[] => {
    if (!segments.length) return [];

    const batches: string[] = [];
    let currentBatch: string[] = [];
    let currentTokens = 0;

    for (const segment of segments) {
        const segmentTokens = Math.ceil(segment.length / TOKENS_PER_CHARACTER);

        if (currentTokens + segmentTokens > maxTokens && currentBatch.length > 0) {
            batches.push(currentBatch.join('\n\n'));
            currentBatch = [segment];
            currentTokens = segmentTokens;
        } else {
            currentBatch.push(segment);
            currentTokens += segmentTokens;
            if (currentBatch.length > 1) {
                currentTokens += 1;
            }
        }
    }

    if (currentBatch.length > 0) {
        batches.push(currentBatch.join('\n\n'));
    }

    return batches;
};

/**
 * Generates translation text by cutting at first punctuation marks found
 */
export const generateTranslationText = (pages: Page[], { maxTokens = 1000 }: TranslationOptions = {}): string[] => {
    if (!pages.length) return [];

    // Process main text
    const processedTexts = processTextSegments(
        pages,
        (page) => page.text,
        (page) => `P${page.page}`,
    );

    // Process footnotes
    const processedFootnotes = processTextSegments(
        pages.filter((page) => page.footnotes),
        (page) => page.footnotes!.trim(),
        (page) => `F${page.page}`,
    );

    const allSegments = [...processedTexts, ...processedFootnotes];

    return splitIntoTokenBatches(allSegments, maxTokens);
};
