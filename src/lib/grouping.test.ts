import { describe, expect, it } from 'bun:test';
import { groupIdsByTokenLimits, TOKEN_LIMIT_GROUPS } from './grouping';

describe('groupIdsByTokenLimits', () => {
    // For Latin text: ~4 chars/token
    // Dynamic overhead for "id1": (3 + 5) / 4 = 2 tokens
    // Total for item = text_tokens + 2 overhead
    const mockExtractText = (id: string) => {
        const tokenTargets: Record<string, number> = {
            id1: 100, // 100 text tokens -> 400 chars
            id2: 200, // 200 text tokens -> 800 chars
            id3: 1000, // 1k text tokens -> 4000 chars
            id4: 4000, // 4k text tokens -> 16000 chars
            id5: 4900, // 4.9k text tokens -> 19600 chars
            id6: 10000, // 10k text tokens -> 40000 chars
            id7: 15000, // 15k text tokens -> 60000 chars
        };
        const tokens = tokenTargets[id] || 100;
        return 'a'.repeat(tokens * 4);
    };

    it('should return empty groups when ids array is empty', () => {
        const result = groupIdsByTokenLimits([], mockExtractText, 0);

        expect(result).toHaveLength(TOKEN_LIMIT_GROUPS.length);
        for (const group of result) {
            expect(group.ids).toEqual([]);
        }
    });

    it('should group ids based on cumulative token count', () => {
        // id1: 100 + 2 = 102 cumulative
        // id2: 200 + 2 = 202, cumulative = 304
        // id3: 1000 + 2 = 1002, cumulative = 1306
        // All under 5k -> group 0
        // id4: 4000 + 2 = 4002, cumulative = 5308 -> crosses 5k -> group 1
        const ids = ['id1', 'id2', 'id3', 'id4'];
        const result = groupIdsByTokenLimits(ids, mockExtractText, 0);

        expect(result[0].ids).toContain('id1');
        expect(result[0].ids).toContain('id2');
        expect(result[0].ids).toContain('id3');
        expect(result[1].ids).toContain('id4');
    });

    it('should account for base prompt tokens', () => {
        // With 4800 base tokens + id1 (102) = 4902, still under 5k
        // With 4900 base tokens + id1 (102) = 5002, crosses 5k -> group 1
        const ids = ['id1'];
        const promptTokens = 4900;

        const result = groupIdsByTokenLimits(ids, mockExtractText, promptTokens);

        expect(result[0].ids).toEqual([]);
        expect(result[1].ids).toContain('id1');
    });

    it('should place items in correct groups based on when they cross thresholds', () => {
        // id1: 102, cumulative 102 -> group 0 (under 5k)
        // id3: 1002, cumulative 1104 -> group 0 (under 5k)
        // id6: 10002, cumulative 11106 -> group 2 (11k-16k)
        const ids = ['id1', 'id3', 'id6'];
        const result = groupIdsByTokenLimits(ids, mockExtractText, 0);

        expect(result[0].ids).toEqual(['id1', 'id3']);
        expect(result[1].ids).toEqual([]);
        expect(result[2].ids).toEqual(['id6']);
    });

    it('should return groups with correct labels and limits', () => {
        const result = groupIdsByTokenLimits([], mockExtractText, 0);

        expect(result[0].label).toBe('Up to 5k');
        expect(result[0].limit).toBe(5000);

        expect(result[1].label).toBe('Up to 11k');
        expect(result[1].limit).toBe(11000);

        expect(result[2].label).toBe('Up to 16k');
        expect(result[2].limit).toBe(16000);

        expect(result[3].label).toBe('16k+');
        expect(result[3].limit).toBe(Number.POSITIVE_INFINITY);
    });

    it('should track lastIndex for each group correctly', () => {
        // id1: 102, cumulative 102 -> group 0, index 0
        // id2: 202, cumulative 304 -> group 0, index 1
        // id3: 1002, cumulative 1306 -> group 0, index 2
        // id4: 4002, cumulative 5308 -> group 1, index 3
        // id5: 4902, cumulative 10210 -> group 1, index 4
        const ids = ['id1', 'id2', 'id3', 'id4', 'id5'];
        const result = groupIdsByTokenLimits(ids, mockExtractText, 0);

        expect(result[0].lastIndex).toBe(2); // id1, id2, id3
        expect(result[1].lastIndex).toBe(4); // id4, id5
    });

    it('should handle single item that exceeds all limits', () => {
        // 50000 tokens * 4 chars = 200000 chars
        const extractHuge = () => 'a'.repeat(200000);
        const result = groupIdsByTokenLimits(['huge'], extractHuge, 0);

        expect(result[0].ids).toEqual([]);
        expect(result[1].ids).toEqual([]);
        expect(result[2].ids).toEqual([]);
        expect(result[3].ids).toContain('huge');
    });

    it('should properly set lastIndex to -1 for empty groups', () => {
        // id6: 10002, goes to group 1 (5k-11k) since cumulative is 10002
        // (Wait, 10002 is in group 1 because 10002 <= 11000)
        const ids = ['id6']; // 10k tokens
        const result = groupIdsByTokenLimits(ids, mockExtractText, 0);

        expect(result[0].lastIndex).toBe(-1);
        expect(result[1].lastIndex).toBe(0);
        expect(result[2].lastIndex).toBe(-1);
        expect(result[3].lastIndex).toBe(-1);
    });
});
