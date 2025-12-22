import { describe, expect, it } from 'bun:test';
import type { CommonLineStartPattern } from 'flappa-doormal';
import { buildPatternTooltip, findSimilarPatterns } from './segmentation';

describe('findSimilarPatterns', () => {
    const createPattern = (pattern: string, count = 10): CommonLineStartPattern => ({
        count,
        examples: [{ line: `Example for ${pattern}`, pageId: 1 }],
        pattern,
    });

    it('returns empty array when no patterns are selected', () => {
        const selected = new Set<string>();
        const allPatterns = [createPattern('{{raqms}} {{dash}}'), createPattern('{{kitab}}')];

        const result = findSimilarPatterns(selected, allPatterns, 0.7);

        expect(result).toEqual([]);
    });

    it('does not include patterns already in selected set', () => {
        const selected = new Set(['{{raqms}} {{dash}}']);
        const allPatterns = [createPattern('{{raqms}} {{dash}}'), createPattern('{{kitab}}')];

        const result = findSimilarPatterns(selected, allPatterns, 0.7);

        expect(result.find((p) => p.pattern === '{{raqms}} {{dash}}')).toBeUndefined();
    });

    it('finds similar patterns based on threshold', () => {
        const selected = new Set(['{{raqms}} -']);
        const allPatterns = [
            createPattern('{{raqms}} -'), // Selected, should be excluded
            createPattern('{{raqms}} –'), // Similar (different dash)
            createPattern('{{kitab}}'), // Not similar at all
        ];

        const result = findSimilarPatterns(selected, allPatterns, 0.7);

        // The similar pattern with different dash should be found
        expect(result.length).toBe(1);
        expect(result[0].pattern).toBe('{{raqms}} –');
    });

    it('returns empty when no similar patterns exist', () => {
        const selected = new Set(['{{kitab}}']);
        const allPatterns = [
            createPattern('{{kitab}}'), // Selected
            createPattern('{{raqms}} {{dash}}'), // Totally different
        ];

        const result = findSimilarPatterns(selected, allPatterns, 0.7);

        expect(result).toEqual([]);
    });
});

describe('buildPatternTooltip', () => {
    it('shows count for pattern with no examples', () => {
        const pattern: CommonLineStartPattern = { count: 42, pattern: '{{raqms}}' };

        const result = buildPatternTooltip(pattern);

        expect(result).toBe('Count: 42');
    });

    it('shows count and example lines', () => {
        const pattern: CommonLineStartPattern = {
            count: 15,
            examples: [
                { line: 'كتاب الصلاة', pageId: 1 },
                { line: 'كتاب الزكاة', pageId: 2 },
            ],
            pattern: '{{kitab}}',
        };

        const result = buildPatternTooltip(pattern);

        expect(result).toContain('Count: 15');
        expect(result).toContain('• كتاب الصلاة');
        expect(result).toContain('• كتاب الزكاة');
    });

    it('truncates long example lines with ellipsis', () => {
        const longLine = 'a'.repeat(60); // 60 chars, should be truncated to 50
        const pattern: CommonLineStartPattern = {
            count: 5,
            examples: [{ line: longLine, pageId: 1 }],
            pattern: 'test',
        };

        const result = buildPatternTooltip(pattern);

        expect(result).toContain(`• ${'a'.repeat(50)}...`);
    });

    it('does not add ellipsis for lines exactly 50 chars', () => {
        const exactLine = 'a'.repeat(50);
        const pattern: CommonLineStartPattern = {
            count: 5,
            examples: [{ line: exactLine, pageId: 1 }],
            pattern: 'test',
        };

        const result = buildPatternTooltip(pattern);

        expect(result).toContain(`• ${exactLine}`);
        expect(result).not.toContain('...');
    });

    it('shows at most 3 examples', () => {
        const pattern: CommonLineStartPattern = {
            count: 100,
            examples: [
                { line: 'Line 1', pageId: 1 },
                { line: 'Line 2', pageId: 2 },
                { line: 'Line 3', pageId: 3 },
                { line: 'Line 4', pageId: 4 },
                { line: 'Line 5', pageId: 5 },
            ],
            pattern: 'test',
        };

        const result = buildPatternTooltip(pattern);

        expect(result).toContain('• Line 1');
        expect(result).toContain('• Line 2');
        expect(result).toContain('• Line 3');
        expect(result).not.toContain('• Line 4');
        expect(result).not.toContain('• Line 5');
    });
});
