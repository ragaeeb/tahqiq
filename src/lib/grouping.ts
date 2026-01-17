import { estimateTokenCount } from 'bitaboom';

/**
 * Token limit thresholds for grouping excerpt IDs.
 * Each group represents a range up to the specified limit.
 */
export const TOKEN_LIMIT_GROUPS = [
    { label: 'Up to 5k', limit: 5000 },
    { label: 'Up to 11k', limit: 11000 },
    { label: 'Up to 16k', limit: 16000 },
    { label: '16k+', limit: Number.POSITIVE_INFINITY },
] as const;

export type TokenGroup = {
    /** Display label for the group */
    label: string;
    /** Token limit threshold */
    limit: number;
    /** IDs that fall within this group's range */
    ids: string[];
    /** The last index in the original array that belongs to this group (-1 if empty) */
    lastIndex: number;
};

// Overhead per item (ID marker, newlines, etc.)
const TOKENS_OVERHEAD_PER_ITEM = 15;

/**
 * Groups an array of IDs by cumulative token count thresholds.
 *
 * @param ids - Array of excerpt IDs to group
 * @param extractText - Function to get the text content for token estimation from an ID
 * @param basePromptTokens - Base token count from the prompt template
 * @returns Array of TokenGroup objects, one for each threshold
 */
export const groupIdsByTokenLimits = (
    ids: string[],
    extractText: (id: string) => string | undefined,
    basePromptTokens: number,
): TokenGroup[] => {
    // Initialize groups
    const groups: TokenGroup[] = TOKEN_LIMIT_GROUPS.map((g) => ({
        ids: [],
        label: g.label,
        lastIndex: -1,
        limit: g.limit,
    }));

    let cumulativeTokens = basePromptTokens;

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const text = extractText(id) || '';
        const itemTokens = estimateTokenCount(text) + TOKENS_OVERHEAD_PER_ITEM;
        cumulativeTokens += itemTokens;

        // Find the appropriate group based on cumulative tokens
        let groupIndex = groups.length - 1; // Default to last group
        for (let g = 0; g < groups.length; g++) {
            if (cumulativeTokens <= groups[g].limit) {
                groupIndex = g;
                break;
            }
        }

        groups[groupIndex].ids.push(id);
        groups[groupIndex].lastIndex = i;
    }

    return groups;
};
