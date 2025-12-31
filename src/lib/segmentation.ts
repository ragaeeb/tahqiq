import { areSimilarAfterNormalization } from 'baburchi';
import type { CommonLineStartPattern, RepeatingSequencePattern, ReplaceRule } from 'flappa-doormal';
import type { RuleConfig } from '@/stores/segmentationStore/types';

type AnyPattern = CommonLineStartPattern | RepeatingSequencePattern;

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
    allPatterns: AnyPattern[],
    threshold: number,
): AnyPattern[] => {
    if (selectedPatterns.size === 0) {
        return [];
    }

    const selectedArray = Array.from(selectedPatterns);
    const similar: AnyPattern[] = [];

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
export const buildPatternTooltip = (pattern: AnyPattern): string => {
    const lines = [`Count: ${pattern.count}`];
    const examples = pattern.examples?.slice(0, 3) ?? [];

    for (const ex of examples) {
        // Handle both LineStartPatternExample (line) and RepeatingSequenceExample (text/content)
        // If exact property is unknown for RepeatingSequence, we look for line or fallback
        const text = (ex as any).line || (ex as any).text || (ex as any).content || JSON.stringify(ex);
        lines.push(`• ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`);
    }

    return lines.join('\n');
};

/**
 * Result type for parseJsonOptions
 */
export type ParsedJsonOptions = { ruleConfigs: RuleConfig[]; sliceAtPunctuation: boolean; replacements: ReplaceRule[] };

/**
 * Parse a JSON options object back into store state.
 * Returns the extracted state values or null if parsing fails.
 *
 * @param json - JSON string containing segmentation options
 * @returns Parsed options or null if invalid JSON
 */
export const parseJsonOptions = (json: string): ParsedJsonOptions | null => {
    try {
        const parsed = JSON.parse(json);

        // Parse rules
        const ruleConfigs: RuleConfig[] = [];
        if (Array.isArray(parsed.rules)) {
            for (const rule of parsed.rules) {
                // Determine patternType based on which key exists
                const patternType: 'lineStartsWith' | 'lineStartsAfter' = rule.lineStartsWith
                    ? 'lineStartsWith'
                    : 'lineStartsAfter';

                const templates: string[] = rule[patternType] || [];
                const template = templates.length === 1 ? templates[0] : templates;

                // Use first template as pattern identifier
                const pattern = templates[0] || '';

                ruleConfigs.push({
                    fuzzy: !!rule.fuzzy,
                    meta: rule.meta, // Store full meta object for custom values
                    metaType: rule.meta?.type || 'none',
                    min: rule.min,
                    pageStartGuard: !!rule.pageStartGuard,
                    pattern,
                    patternType,
                    template,
                });
            }
        }

        // Parse sliceAtPunctuation from breakpoints
        const sliceAtPunctuation = Array.isArray(parsed.breakpoints) && parsed.breakpoints.length > 0;

        // Parse replacements
        const replacements: ReplaceRule[] = [];
        if (Array.isArray(parsed.replace)) {
            for (const r of parsed.replace) {
                if (r.regex !== undefined && r.replacement !== undefined) {
                    replacements.push({ regex: r.regex, replacement: r.replacement });
                }
            }
        }

        return { replacements, ruleConfigs, sliceAtPunctuation };
    } catch {
        return null;
    }
};
