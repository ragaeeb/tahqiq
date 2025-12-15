import { patchApply, patchFromText, patchMake, patchToText } from 'diff-match-patch-es';

/**
 * Creates a serialized patch string from old and new text.
 * Returns null if there are no changes.
 */
export const createPatch = (oldText: string, newText: string): string | null => {
    if (oldText === newText) {
        return null;
    }

    const patches = patchMake(oldText, newText);

    if (patches.length === 0) {
        return null;
    }

    return patchToText(patches);
};

/**
 * Applies a serialized patch to the original text.
 * Returns the patched text and a success flag array.
 */
export const applyPatch = (patchText: string, originalText: string): { result: string; success: boolean[] } => {
    const patches = patchFromText(patchText);
    const applied = patchApply(patches, originalText) as [string, boolean[]];
    return { result: applied[0], success: applied[1] };
};

/**
 * Checks if a patch can be applied cleanly to the given text.
 */
export const canApplyPatch = (patchText: string, originalText: string): boolean => {
    try {
        const { success } = applyPatch(patchText, originalText);
        return success.every(Boolean);
    } catch {
        return false;
    }
};
