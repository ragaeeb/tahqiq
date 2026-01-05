import { describe, expect, it } from 'bun:test';
import type { CommonLineStartPattern } from 'flappa-doormal';
import {
    buildPatternTooltip,
    countWords,
    detectMergeableShortExcerpts,
    findSimilarPatterns,
    mergeShortAdjacentSegments,
    parseJsonOptions,
} from './segmentation';

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

describe('parseJsonOptions', () => {
    it('returns null for invalid JSON', () => {
        const result = parseJsonOptions('not valid json');

        expect(result).toBeNull();
    });

    it('returns empty rules and replacements for minimal valid JSON', () => {
        const result = parseJsonOptions('{}');

        expect(result).not.toBeNull();
        expect(result?.ruleConfigs).toEqual([]);
        expect(result?.replacements).toEqual([]);
        expect(result?.sliceAtPunctuation).toBe(false);
    });

    it('parses lineStartsWith rules', () => {
        const json = JSON.stringify({ rules: [{ lineStartsWith: ['{{kitab}} '] }] });

        const result = parseJsonOptions(json);

        expect(result?.ruleConfigs).toHaveLength(1);
        expect(result?.ruleConfigs[0].patternType).toBe('lineStartsWith');
        expect(result?.ruleConfigs[0].template).toBe('{{kitab}} ');
        expect(result?.ruleConfigs[0].pattern).toBe('{{kitab}} ');
    });

    it('parses lineStartsAfter rules', () => {
        const json = JSON.stringify({ rules: [{ lineStartsAfter: ['{{raqms}} text'] }] });

        const result = parseJsonOptions(json);

        expect(result?.ruleConfigs).toHaveLength(1);
        expect(result?.ruleConfigs[0].patternType).toBe('lineStartsAfter');
        expect(result?.ruleConfigs[0].template).toBe('{{raqms}} text');
    });

    it('parses array templates for merged rules', () => {
        const json = JSON.stringify({ rules: [{ lineStartsAfter: ['Template A', 'Template B'] }] });

        const result = parseJsonOptions(json);

        expect(result?.ruleConfigs[0].template).toEqual(['Template A', 'Template B']);
        expect(result?.ruleConfigs[0].pattern).toBe('Template A');
    });

    it('parses fuzzy flag', () => {
        const json = JSON.stringify({ rules: [{ fuzzy: true, lineStartsWith: ['{{kitab}}'] }] });

        const result = parseJsonOptions(json);

        expect(result?.ruleConfigs[0].fuzzy).toBe(true);
    });

    it('parses pageStartGuard flag', () => {
        const json = JSON.stringify({ rules: [{ lineStartsAfter: ['test'], pageStartGuard: '{{tarqim}}' }] });

        const result = parseJsonOptions(json);

        expect(result?.ruleConfigs[0].pageStartGuard).toBe(true);
    });

    it('parses meta type', () => {
        const json = JSON.stringify({ rules: [{ lineStartsWith: ['{{kitab}}'], meta: { type: 'book' } }] });

        const result = parseJsonOptions(json);

        expect(result?.ruleConfigs[0].metaType).toBe('book');
    });

    it('defaults metaType to none when not specified', () => {
        const json = JSON.stringify({ rules: [{ lineStartsAfter: ['test'] }] });

        const result = parseJsonOptions(json);

        expect(result?.ruleConfigs[0].metaType).toBe('none');
    });

    it('parses min value', () => {
        const json = JSON.stringify({ rules: [{ lineStartsAfter: ['test'], min: 5 }] });

        const result = parseJsonOptions(json);

        expect(result?.ruleConfigs[0].min).toBe(5);
    });

    it('detects sliceAtPunctuation from breakpoints', () => {
        const json = JSON.stringify({ breakpoints: [{ pattern: '{{tarqim}}\\s*' }, ''], rules: [] });

        const result = parseJsonOptions(json);

        expect(result?.sliceAtPunctuation).toBe(true);
    });

    it('sets sliceAtPunctuation false when no breakpoints', () => {
        const json = JSON.stringify({ rules: [] });

        const result = parseJsonOptions(json);

        expect(result?.sliceAtPunctuation).toBe(false);
    });

    it('sets sliceAtPunctuation false for empty breakpoints array', () => {
        const json = JSON.stringify({ breakpoints: [], rules: [] });

        const result = parseJsonOptions(json);

        expect(result?.sliceAtPunctuation).toBe(false);
    });

    it('parses replacements', () => {
        const json = JSON.stringify({
            replace: [
                { regex: 'foo', replacement: 'bar' },
                { regex: 'baz', replacement: 'qux' },
            ],
            rules: [],
        });

        const result = parseJsonOptions(json);

        expect(result?.replacements).toHaveLength(2);
        expect(result?.replacements[0]).toEqual({ regex: 'foo', replacement: 'bar' });
        expect(result?.replacements[1]).toEqual({ regex: 'baz', replacement: 'qux' });
    });

    it('filters out invalid replacement entries', () => {
        const json = JSON.stringify({
            replace: [
                { regex: 'valid', replacement: 'ok' },
                { regex: 'missing-replacement' },
                { replacement: 'missing-regex' },
                {},
            ],
            rules: [],
        });

        const result = parseJsonOptions(json);

        expect(result?.replacements).toHaveLength(1);
        expect(result?.replacements[0]).toEqual({ regex: 'valid', replacement: 'ok' });
    });

    it('handles empty templates array gracefully', () => {
        const json = JSON.stringify({ rules: [{ lineStartsAfter: [] }] });

        const result = parseJsonOptions(json);

        expect(result?.ruleConfigs).toHaveLength(1);
        expect(result?.ruleConfigs[0].pattern).toBe('');
        expect(result?.ruleConfigs[0].template).toEqual([]);
    });

    it('parses complete JSON with all options', () => {
        const json = JSON.stringify({
            breakpoints: [{ pattern: '{{tarqim}}\\s*' }, ''],
            maxPages: 1,
            replace: [{ regex: 'a', replacement: 'b' }],
            rules: [
                { fuzzy: true, lineStartsWith: ['{{kitab}}'], meta: { type: 'book' } },
                { lineStartsAfter: ['{{raqms}}'], min: 3, pageStartGuard: '{{tarqim}}' },
            ],
        });

        const result = parseJsonOptions(json);

        expect(result?.ruleConfigs).toHaveLength(2);
        expect(result?.ruleConfigs[0].patternType).toBe('lineStartsWith');
        expect(result?.ruleConfigs[0].fuzzy).toBe(true);
        expect(result?.ruleConfigs[0].metaType).toBe('book');
        expect(result?.ruleConfigs[1].patternType).toBe('lineStartsAfter');
        expect(result?.ruleConfigs[1].min).toBe(3);
        expect(result?.ruleConfigs[1].pageStartGuard).toBe(true);
        expect(result?.sliceAtPunctuation).toBe(true);
        expect(result?.replacements).toHaveLength(1);
    });
});

describe('countWords', () => {
    it('should return 0 for empty string', () => {
        expect(countWords('')).toBe(0);
    });

    it('should return 0 for whitespace-only string', () => {
        expect(countWords('   \n\t  ')).toBe(0);
    });

    it('should count English words correctly', () => {
        expect(countWords('hello world')).toBe(2);
        expect(countWords('one two three four five')).toBe(5);
    });

    it('should count Arabic words correctly', () => {
        expect(countWords('بسم الله الرحمن الرحيم')).toBe(4);
        expect(countWords('السلام عليكم')).toBe(2);
    });

    it('should handle mixed whitespace', () => {
        expect(countWords('word1  word2\nword3\t\tword4')).toBe(4);
    });

    it('should trim leading and trailing whitespace', () => {
        expect(countWords('  hello world  ')).toBe(2);
    });
});

describe('mergeShortAdjacentSegments', () => {
    it('should return empty array for empty input', () => {
        expect(mergeShortAdjacentSegments([], 30)).toEqual([]);
    });

    it('should return single segment unchanged', () => {
        const segments = [{ content: 'hello world', from: 1 }];
        expect(mergeShortAdjacentSegments(segments, 30)).toEqual(segments);
    });

    it('should merge two short segments with same from/to', () => {
        const segments = [
            { content: 'short text', from: 1, to: 1 },
            { content: 'another short', from: 1, to: 1 },
        ];
        const result = mergeShortAdjacentSegments(segments, 30);
        expect(result).toHaveLength(1);
        expect(result[0].content).toBe('short text\n\nanother short');
        expect(result[0].from).toBe(1);
    });

    it('should not merge segments from different pages', () => {
        const segments = [
            { content: 'short text', from: 1 },
            { content: 'another short', from: 2 },
        ];
        const result = mergeShortAdjacentSegments(segments, 30);
        expect(result).toHaveLength(2);
    });

    it('should not merge long segments even with same from', () => {
        const longText = 'word '.repeat(35).trim(); // 35 words
        const segments = [
            { content: longText, from: 1 },
            { content: longText, from: 1 },
        ];
        const result = mergeShortAdjacentSegments(segments, 30);
        expect(result).toHaveLength(2);
    });

    it('should merge when one segment is short and same page', () => {
        const longText = 'word '.repeat(35).trim();
        const segments = [
            { content: 'short text', from: 1 },
            { content: longText, from: 1 },
        ];
        // Short current with long next on same page should merge
        const result = mergeShortAdjacentSegments(segments, 30);
        expect(result).toHaveLength(1);
    });

    it('should handle chain of short segments on same page', () => {
        const segments = [
            { content: 'first', from: 1 },
            { content: 'second', from: 1 },
            { content: 'third', from: 1 },
        ];
        const result = mergeShortAdjacentSegments(segments, 30);
        expect(result).toHaveLength(1);
        expect(result[0].content).toBe('first\n\nsecond\n\nthird');
    });

    it('should preserve meta from first segment', () => {
        const segments = [
            { content: 'first', from: 1, meta: { type: 'chapter' } },
            { content: 'second', from: 1, meta: { type: 'book' } },
        ];
        const result = mergeShortAdjacentSegments(segments, 30);
        expect(result[0].meta).toEqual({ type: 'chapter' });
    });
});

describe('detectMergeableShortExcerpts', () => {
    it('should return 0 for empty array', () => {
        expect(detectMergeableShortExcerpts([], 30)).toBe(0);
    });

    it('should return 0 for single excerpt', () => {
        const excerpts = [{ from: 1, id: '1', nass: 'text' }];
        expect(detectMergeableShortExcerpts(excerpts, 30)).toBe(0);
    });

    it('should detect mergeable pair with same from and short content', () => {
        const excerpts = [
            { from: 1, id: '1', nass: 'short text' },
            { from: 1, id: '2', nass: 'also short' },
        ];
        expect(detectMergeableShortExcerpts(excerpts, 30)).toBe(1);
    });

    it('should not count pair from different pages', () => {
        const excerpts = [
            { from: 1, id: '1', nass: 'short' },
            { from: 2, id: '2', nass: 'short' },
        ];
        expect(detectMergeableShortExcerpts(excerpts, 30)).toBe(0);
    });

    it('should not count pair where both are long', () => {
        const longText = 'word '.repeat(35).trim();
        const excerpts = [
            { from: 1, id: '1', nass: longText },
            { from: 1, id: '2', nass: longText },
        ];
        expect(detectMergeableShortExcerpts(excerpts, 30)).toBe(0);
    });

    it('should count multiple mergeable pairs', () => {
        const excerpts = [
            { from: 1, id: '1', nass: 'short 1' },
            { from: 1, id: '2', nass: 'short 2' },
            { from: 1, id: '3', nass: 'short 3' },
        ];
        // 1-2 is a pair, 2-3 is a pair = 2 pairs
        expect(detectMergeableShortExcerpts(excerpts, 30)).toBe(2);
    });

    it('should handle excerpts with to field', () => {
        const excerpts = [
            { from: 1, id: '1', nass: 'short', to: 2 },
            { from: 1, id: '2', nass: 'short', to: 2 },
        ];
        expect(detectMergeableShortExcerpts(excerpts, 30)).toBe(1);
    });

    it('should not count pair with different to values', () => {
        const excerpts = [
            { from: 1, id: '1', nass: 'short', to: 2 },
            { from: 1, id: '2', nass: 'short', to: 3 },
        ];
        expect(detectMergeableShortExcerpts(excerpts, 30)).toBe(0);
    });
});
