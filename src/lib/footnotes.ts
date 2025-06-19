import type { TextLine } from '@/stores/manuscriptStore/types';

const arabicReferenceRegex = /\([\u0660-\u0669]\)/g;
const arabicFootnoteReferenceRegex = /^\([\u0660-\u0669]\)/g;
// OCR-confused characters that look like Arabic digits
const ocrConfusedReferenceRegex = /\([.1OV9]\)/g;
const ocrConfusedFootnoteReferenceRegex = /^\([.1OV9]\)/g;
// Combined pattern for detecting any invalid/problematic references
const invalidReferenceRegex = /\(\)|[.1OV9]\)/g;

const INVALID_FOOTNOTE = '()';

// Reusable function to detect if text has invalid footnotes
export const hasInvalidFootnotes = (text: string): boolean => {
    return invalidReferenceRegex.test(text);
};

// Arabic number formatter instance
const arabicFormatter = new Intl.NumberFormat('ar-SA');

// Helper function to convert numbers to Arabic numerals using Intl
const numberToArabic = (num: number): string => {
    return arabicFormatter.format(num);
};

// Helper function to convert OCR-confused characters to Arabic numerals
const ocrToArabic = (char: string): string => {
    const ocrToArabicMap: { [key: string]: string } = {
        '1': '١', // 1 is fine as is
        '9': '٩', // 9 already looks like Arabic 9
        '.': '٠', // Period looks like Arabic zero
        O: '٥', // O looks like Arabic 5
        V: '٧', // V looks like Arabic 7
    };

    return char.replace(/[.1OV9]/g, (match) => ocrToArabicMap[match] || match);
};

// Extract all references from lines
const extractReferences = (lines: TextLine[]) => {
    const arabicReferencesInBody = lines
        .filter((b) => !b.isFootnote)
        .flatMap((b) => b.text.match(arabicReferenceRegex) || []);

    const ocrConfusedReferencesInBody = lines
        .filter((b) => !b.isFootnote)
        .flatMap((b) => b.text.match(ocrConfusedReferenceRegex) || []);

    const arabicReferencesInFootnotes = lines
        .filter((b) => b.isFootnote)
        .flatMap((b) => b.text.match(arabicFootnoteReferenceRegex) || []);

    const ocrConfusedReferencesInFootnotes = lines
        .filter((b) => b.isFootnote)
        .flatMap((b) => b.text.match(ocrConfusedFootnoteReferenceRegex) || []);

    // Convert OCR-confused characters to Arabic for consistent comparison
    const convertedOcrBodyRefs = ocrConfusedReferencesInBody.map((ref) =>
        ref.replace(/[.1OV9]/g, (char) => ocrToArabic(char)),
    );

    const convertedOcrFootnoteRefs = ocrConfusedReferencesInFootnotes.map((ref) =>
        ref.replace(/[.1OV9]/g, (char) => ocrToArabic(char)),
    );

    return {
        bodyReferences: [...arabicReferencesInBody, ...convertedOcrBodyRefs],
        footnoteReferences: [...arabicReferencesInFootnotes, ...convertedOcrFootnoteRefs],
        ocrConfusedInBody: ocrConfusedReferencesInBody,
        ocrConfusedInFootnotes: ocrConfusedReferencesInFootnotes,
    };
};

// Check if corrections are needed
const needsCorrection = (lines: TextLine[], references: ReturnType<typeof extractReferences>) => {
    const mistakenReferences = lines.filter((line) => hasInvalidFootnotes(line.text));

    return (
        mistakenReferences.length > 0 ||
        references.bodyReferences.length !== references.footnoteReferences.length ||
        references.ocrConfusedInBody.length > 0 ||
        references.ocrConfusedInFootnotes.length > 0
    );
};

// Process body text corrections
const correctBodyText = (text: string, usedReferences: Set<string>, referenceCounter: { count: number }): string => {
    let updatedText = text;

    // Replace invalid footnotes with Arabic numerals
    if (updatedText.includes(INVALID_FOOTNOTE)) {
        const arabicRef = `(${numberToArabic(referenceCounter.count)})`;
        updatedText = updatedText.replace(INVALID_FOOTNOTE, arabicRef);
        usedReferences.add(arabicRef);
        referenceCounter.count++;
    }

    // Convert OCR-confused characters to Arabic
    updatedText = updatedText.replace(ocrConfusedReferenceRegex, (match) => {
        return match.replace(/[.1OV9]/g, (char) => ocrToArabic(char));
    });

    return updatedText;
};

// Process footnote text corrections
const correctFootnoteText = (
    text: string,
    usedReferences: Set<string>,
    referenceCounter: { count: number },
): string => {
    let updatedText = text;

    // Replace invalid footnotes with Arabic numerals
    if (updatedText.includes(INVALID_FOOTNOTE)) {
        // Find the corresponding reference from body or use the last created one
        let targetRef = '';
        if (usedReferences.size > 0) {
            // Use the most recently created reference
            const refsArray = Array.from(usedReferences);
            targetRef = refsArray[refsArray.length - 1];
        } else {
            targetRef = `(${numberToArabic(referenceCounter.count)})`;
            usedReferences.add(targetRef);
            referenceCounter.count++;
        }
        updatedText = updatedText.replace(INVALID_FOOTNOTE, targetRef);
    }

    // Convert OCR-confused characters to Arabic in footnotes
    updatedText = updatedText.replace(ocrConfusedFootnoteReferenceRegex, (match) => {
        return match.replace(/[.1OV9]/g, (char) => ocrToArabic(char));
    });

    return updatedText;
};

// Apply corrections to all lines
const applyCorrections = (lines: TextLine[]): TextLine[] => {
    const usedReferences = new Set<string>();
    const referenceCounter = { count: 1 };

    return lines.map((line) => {
        if (!line.isFootnote) {
            const correctedText = correctBodyText(line.text, usedReferences, referenceCounter);
            return { ...line, text: correctedText };
        } else {
            const correctedText = correctFootnoteText(line.text, usedReferences, referenceCounter);
            return { ...line, text: correctedText };
        }
    });
};

// Main function
export const correctReferences = (lines: TextLine[]): TextLine[] => {
    const references = extractReferences(lines);

    if (needsCorrection(lines, references)) {
        return applyCorrections(lines);
    }

    // If no corrections are needed, return the original array
    return lines;
};
