import type { TextBlock } from 'kokokor';

const arabicReferenceRegex = /\([\u0660-\u0669]\)/g;
const arabicFootnoteReferenceRegex = /^\([\u0660-\u0669]\)/g;

export const correctReferences = (blocks: TextBlock[]): TextBlock[] => {
    const referencesInBody = blocks
        .filter((b) => !b.isFootnote)
        .flatMap((b) => {
            return b.text.match(arabicReferenceRegex) || [];
        });

    const referencesInFootnotes = blocks
        .filter((b) => b.isFootnote)
        .flatMap((b) => {
            return b.text.match(arabicFootnoteReferenceRegex) || [];
        });

    const mistakenReferences = blocks.filter((b) => b.text.includes('()'));

    if (
        mistakenReferences.length > 0 &&
        referencesInBody.length > referencesInFootnotes.length &&
        referencesInBody.length > 0
    ) {
        const usedReferences = new Set<string>();

        return blocks.map((block) => {
            // Only process blocks that contain '()'
            if (block.text.includes('()')) {
                const missing = referencesInBody.find(
                    (r) => !referencesInFootnotes.includes(r) && !usedReferences.has(r),
                );

                if (missing) {
                    usedReferences.add(missing);

                    // Return a new block with the corrected text
                    return {
                        ...block,
                        text: block.text.replace('()', missing),
                    };
                }
            }

            // Return the original block unchanged
            return block;
        });
    }

    // If no corrections are needed, return the original array
    return blocks;
};
