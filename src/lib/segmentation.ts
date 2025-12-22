import { areSimilarAfterNormalization } from 'baburchi';
import type { CommonLineStartPattern } from 'flappa-doormal';

/**
 * Finds patterns that are similar to the selected patterns (likely typos)
 * Returns patterns NOT in the selected set that are similar to at least one selected pattern
 *
 * @param selectedPatterns - Set of currently selected pattern strings
 * @param allPatterns - Array of all available patterns
 * @param threshold - Similarity threshold (0-1) for considering patterns as similar
 * @returns Array of patterns similar to selected ones but not in the selected set
 */
export const findSimilarPatterns = (
    selectedPatterns: Set<string>,
    allPatterns: CommonLineStartPattern[],
    threshold: number,
): CommonLineStartPattern[] => {
    if (selectedPatterns.size === 0) {
        return [];
    }

    const selectedArray = Array.from(selectedPatterns);
    const similar: CommonLineStartPattern[] = [];

    for (const pattern of allPatterns) {
        // Skip if already selected
        if (selectedPatterns.has(pattern.pattern)) {
            continue;
        }

        // Check similarity to each selected pattern
        for (const selected of selectedArray) {
            const similarity = areSimilarAfterNormalization(pattern.pattern, selected, threshold);
            if (similarity) {
                similar.push(pattern);
                break;
            }
        }
    }

    return similar;
};

/**
 * Builds a tooltip string with count and up to 3 example lines
 *
 * @param pattern - Pattern object with count and examples
 * @returns Formatted tooltip string
 */
export const buildPatternTooltip = (pattern: CommonLineStartPattern): string => {
    const lines = [`Count: ${pattern.count}`];
    const examples = pattern.examples?.slice(0, 3) ?? [];

    for (const ex of examples) {
        lines.push(`• ${ex.line.slice(0, 50)}${ex.line.length > 50 ? '...' : ''}`);
    }

    return lines.join('\n');
};
