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

/**
 * Counts words in text by splitting on whitespace.
 * Works for both Arabic and English text.
 *
 * @param text - The text to count words in
 * @returns Number of words in the text
 */
export const countWords = (text: string): number => {
    if (!text) {
        return 0;
    }
    return text.trim().split(/\s+/).filter(Boolean).length;
};

type SegmentLike = { from: number; to?: number; content: string; meta?: Record<string, unknown> };

/**
 * Merges adjacent short segments that have the same `from` and `to` values.
 * A segment is considered "short" if it has fewer words than minWordCount.
 *
 * @param segments - Array of segments to process
 * @param minWordCount - Minimum word count threshold for short segments
 * @returns Array of merged segments
 */
export const mergeShortAdjacentSegments = <T extends SegmentLike>(segments: T[], minWordCount: number): T[] => {
    if (segments.length === 0) {
        return segments;
    }

    const result: T[] = [];
    let current = { ...segments[0] };

    for (let i = 1; i < segments.length; i++) {
        const next = segments[i];
        const currentWordCount = countWords(current.content);
        const nextWordCount = countWords(next.content);

        // Check if both segments are short and have same from/to
        const currentIsShort = currentWordCount < minWordCount;
        const nextIsShort = nextWordCount < minWordCount;
        const sameFrom = current.from === next.from;
        const sameTo = current.to === next.to;

        if ((currentIsShort || nextIsShort) && sameFrom && sameTo) {
            // Merge: combine content with newline separator
            current = {
                ...current,
                content: `${current.content}\n\n${next.content}`,
                // Preserve meta from first segment
            };
        } else {
            // Push current and move to next
            result.push(current as T);
            current = { ...next };
        }
    }
    // Don't forget the last segment
    result.push(current as T);

    return result;
};

type ExcerptLike = { id: string; from: number; to?: number; nass?: string };

/**
 * Detects how many pairs of adjacent short excerpts could be merged.
 * Used to show a toast notification prompting the user to merge.
 *
 * @param excerpts - Array of excerpts to check
 * @param minWordCount - Minimum word count threshold for short excerpts
 * @returns Number of mergeable pairs
 */
export const detectMergeableShortExcerpts = (excerpts: ExcerptLike[], minWordCount: number): number => {
    if (excerpts.length < 2) {
        return 0;
    }

    let mergeablePairs = 0;

    for (let i = 0; i < excerpts.length - 1; i++) {
        const current = excerpts[i];
        const next = excerpts[i + 1];

        const currentWordCount = countWords(current.nass || '');
        const nextWordCount = countWords(next.nass || '');

        const currentIsShort = currentWordCount < minWordCount;
        const nextIsShort = nextWordCount < minWordCount;
        const sameFrom = current.from === next.from;
        const sameTo = current.to === next.to;

        if ((currentIsShort || nextIsShort) && sameFrom && sameTo) {
            mergeablePairs++;
        }
    }

    return mergeablePairs;
};
