import type { TextLine } from '@/stores/manuscriptStore/types';

const arabicReferenceRegex = /\([\u0660-\u0669]\)/g;
const arabicFootnoteReferenceRegex = /^\([\u0660-\u0669]\)/g;

export const correctReferences = (lines: TextLine[]): TextLine[] => {
    const referencesInBody = lines
        .filter((b) => !b.isFootnote)
        .flatMap((b) => {
            return b.text.match(arabicReferenceRegex) || [];
        });

    const referencesInFootnotes = lines
        .filter((b) => b.isFootnote)
        .flatMap((b) => {
            return b.text.match(arabicFootnoteReferenceRegex) || [];
        });

    const mistakenReferences = lines.filter((b) => b.text.includes('()'));

    if (
        mistakenReferences.length > 0 &&
        referencesInBody.length > referencesInFootnotes.length &&
        referencesInBody.length > 0
    ) {
        const usedReferences = new Set<string>();

        return lines.map((line) => {
            // Only process blocks that contain '()'
            if (line.text.includes('()')) {
                const missing = referencesInBody.find(
                    (r) => !referencesInFootnotes.includes(r) && !usedReferences.has(r),
                );

                if (missing) {
                    usedReferences.add(missing);

                    // Return a new block with the corrected text
                    return {
                        ...line,
                        text: line.text.replace('()', missing),
                    };
                }
            }

            // Return the original block unchanged
            return line;
        });
    }

    // If no corrections are needed, return the original array
    return lines;
};
