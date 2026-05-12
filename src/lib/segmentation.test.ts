import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';
import { LatestContractVersion, Markers } from '@/lib/constants';

const segmentPagesMock = mock(() => []);
const validateSegmentsMock = mock(() => ({ issues: [] }));

mock.module('flappa-doormal', () => ({ segmentPages: segmentPagesMock, validateSegments: validateSegmentsMock }));

type DebugMeta = import('./segmentation').DebugMeta;

let segmentation: typeof import('./segmentation');

beforeAll(async () => {
    segmentation = await import('./segmentation');
});
afterAll(() => {
    mock.restore();
});

describe('Debug Metadata Utilities', () => {
    describe('getMetaKey', () => {
        it('should return _flappa when debug is true', () => {
            expect(segmentation.getMetaKey(true)).toBe('_flappa');
        });

        it('should return _flappa when debug is undefined/false/null', () => {
            expect(segmentation.getMetaKey(undefined)).toBe('_flappa');
            expect(segmentation.getMetaKey(false)).toBe('_flappa');
            expect(segmentation.getMetaKey(null)).toBe('_flappa');
        });

        it('should return custom metaKey when provided in debug object', () => {
            expect(segmentation.getMetaKey({ metaKey: 'custom_key' })).toBe('custom_key');
        });

        it('should fallback to _flappa if debug object lacks metaKey string', () => {
            expect(segmentation.getMetaKey({})).toBe('_flappa');
            expect(segmentation.getMetaKey({ metaKey: 123 })).toBe('_flappa');
        });
    });

    describe('getSegmentFilterKey', () => {
        it('should return contentLengthSplit reason', () => {
            const meta: DebugMeta = { contentLengthSplit: { maxContentLength: 5000, splitReason: 'whitespace' } };
            expect(segmentation.getSegmentFilterKey(meta)).toBe('contentLengthSplit:whitespace');
        });

        it('should return breakpoint pattern', () => {
            const meta: DebugMeta = { breakpoint: { index: 0, kind: 'pattern', pattern: '{{tarqim}}' } };
            expect(segmentation.getSegmentFilterKey(meta)).toBe('breakpoint:{{tarqim}}');
        });

        it('should return rule-only when no special split', () => {
            const meta: DebugMeta = { rule: { index: 0, patternType: 'lineStartsWith' } };
            expect(segmentation.getSegmentFilterKey(meta)).toBe('rule-only');
        });

        it('should return none when meta is undefined', () => {
            expect(segmentation.getSegmentFilterKey(undefined)).toBe('none');
        });

        it('should return breakpoint:page-boundary for pageBoundary kind', () => {
            const meta: DebugMeta = { breakpoint: { index: 0, kind: 'pageBoundary', pattern: '' } };
            expect(segmentation.getSegmentFilterKey(meta)).toBe('breakpoint:page-boundary');
        });

        it('should return breakpoint:page-boundary fallback when pattern/word missing', () => {
            const meta: DebugMeta = { breakpoint: { index: 0, kind: 'unknown', pattern: '' } };
            expect(segmentation.getSegmentFilterKey(meta)).toBe('breakpoint:page-boundary');
        });

        it('should return breakpoint:word:xyz for word matches', () => {
            const meta: DebugMeta = { breakpoint: { index: 0, kind: 'word', pattern: '', word: 'xyz' } };
            expect(segmentation.getSegmentFilterKey(meta)).toBe('breakpoint:word:xyz');
        });

        it('should prioritize contentLengthSplit over breakpoint if both exist (rare)', () => {
            const meta: DebugMeta = {
                breakpoint: { index: 0, kind: 'pattern', pattern: 'foo' },
                contentLengthSplit: { maxContentLength: 100, splitReason: 'unicode_boundary' },
            };
            expect(segmentation.getSegmentFilterKey(meta)).toBe('contentLengthSplit:unicode_boundary');
        });
    });
});

describe('mapPagesToExcerpts', () => {
    it('should generate note and footnote IDs once segments exceed letter limits', () => {
        const segments = Array.from({ length: 54 }, () => ({ content: 'السلام عليكم ورحمة الله وبركاته', from: 1 }));
        const report = { issues: ['ok'] };
        const before = Math.floor(Date.now() / 1000);

        segmentPagesMock.mockReturnValueOnce(segments as any);
        validateSegmentsMock.mockReturnValueOnce(report as any);

        const result = segmentation.mapPagesToExcerpts([{ content: 'page 1', id: 1 }] as any, [], {
            minWordsPerSegment: 0,
            replace: [],
        } as any);

        expect(result.excerpts).toHaveLength(54);
        expect(result.excerpts[0].id).toBe('P1');
        expect(result.excerpts[27].id).toBe('N1a');
        expect(result.excerpts[53].id).toBe('F1a');
        expect(result.report).toEqual(report as any);
        const after = Math.floor(Date.now() / 1000);
        expect(result.createdAt).toBeGreaterThanOrEqual(before);
        expect(result.createdAt).toBeLessThanOrEqual(after);
        expect(result.lastUpdatedAt).toBeGreaterThanOrEqual(before);
        expect(result.lastUpdatedAt).toBeLessThanOrEqual(after);
    });

    it('should map headings, preserve meta/to, and skip short sanitized segments', () => {
        const segments = [
            { content: 'بسم الله', from: 1, meta: { type: Markers.Book } },
            { content: 'ا', from: 1 },
            { content: 'الحمد لله', from: 2, meta: { custom: true }, to: 3 },
        ];
        const report = { issues: [] };
        const before = Math.floor(Date.now() / 1000);

        segmentPagesMock.mockReturnValueOnce(segments as any);
        validateSegmentsMock.mockReturnValueOnce(report as any);

        const result = segmentation.mapPagesToExcerpts(
            [{ content: 'page 1', id: 1 }] as any,
            [
                { content: 'Heading 1', id: 10 },
                { content: 'Heading 2', id: 12 },
            ] as any,
            { minWordsPerSegment: 0, replace: [] } as any,
        );

        expect(result.contractVersion).toBe(LatestContractVersion.Excerpts);
        expect(result.excerpts).toHaveLength(2);
        expect(result.excerpts[0].id).toBe('B1');
        expect(result.excerpts[1].id).toBe('P2');
        expect(result.excerpts[1].to).toBe(3);
        expect(result.excerpts[1].meta).toEqual({ custom: true } as any);
        expect(result.headings).toEqual([
            { from: 10, id: 'T10', nass: 'Heading 1' },
            { from: 12, id: 'T12', nass: 'Heading 2' },
        ] as any);
        const after = Math.floor(Date.now() / 1000);
        expect(result.createdAt).toBeGreaterThanOrEqual(before);
        expect(result.createdAt).toBeLessThanOrEqual(after);
        expect(result.lastUpdatedAt).toBeGreaterThanOrEqual(before);
        expect(result.lastUpdatedAt).toBeLessThanOrEqual(after);
    });
});
describe('mergeShortSegments', () => {
    const minWords = 5;

    it('should return original segments if length < 2', () => {
        expect(segmentation.mergeShortSegments([], minWords)).toEqual([]);
        const single = [{ content: 'short', from: 1 }];
        expect(segmentation.mergeShortSegments(single as any, minWords)).toEqual(single as any);
    });

    it('should merge short segment with next if matching pages', () => {
        const input = [
            { content: 'one two', from: 1, to: 1 }, // Short (<5)
            { content: 'three four five six seven', from: 1, to: 1 }, // Long
        ];
        const result = segmentation.mergeShortSegments(input as any, minWords);
        expect(result).toHaveLength(1);
        expect(result[0].content).toBe('one two\nthree four five six seven');
        expect(result[0].from).toBe(1);
    });

    it('should merge segment with next short segment if matching pages', () => {
        const input = [
            { content: 'one two three four five six', from: 1, to: 1 }, // Long
            { content: 'seven eight', from: 1, to: 1 }, // Short (<5)
        ];
        const result = segmentation.mergeShortSegments(input as any, minWords);
        expect(result).toHaveLength(1);
        expect(result[0].content).toBe('one two three four five six\nseven eight');
    });

    it('should merge two consecutive short segments', () => {
        const input = [
            { content: 'one', from: 1, to: 1 },
            { content: 'two', from: 1, to: 1 },
        ];
        const result = segmentation.mergeShortSegments(input as any, minWords);
        expect(result).toHaveLength(1);
        expect(result[0].content).toBe('one\ntwo');
    });

    it('should NOT merge if pages differ (from mismatch)', () => {
        const input = [
            { content: 'one', from: 1, to: 1 },
            { content: 'two', from: 2, to: 2 },
        ];
        const result = segmentation.mergeShortSegments(input as any, minWords);
        expect(result).toHaveLength(2);
    });

    it('should NOT merge if pages differ (to mismatch)', () => {
        const input = [
            { content: 'one', from: 1, to: 1 },
            { content: 'two', from: 1, to: 2 },
        ];
        const result = segmentation.mergeShortSegments(input as any, minWords);
        expect(result).toHaveLength(2);
    });

    it('should NOT merge if both segments satisfy min word count', () => {
        const input = [
            { content: 'one two three four five', from: 1, to: 1 }, // 5 words
            { content: 'six seven eight nine ten', from: 1, to: 1 }, // 5 words
        ];
        const result = segmentation.mergeShortSegments(input as any, 5);
        expect(result).toHaveLength(2);
    });

    it('should handle undefined/null content gracefully', () => {
        const input = [
            { content: undefined, from: 1, to: 1 },
            { content: 'word', from: 1, to: 1 },
        ];
        const result = segmentation.mergeShortSegments(input as any, 5);
        expect(result).toHaveLength(1);
        // undefined content becomes empty string, so "\nword"
        expect(result[0].content).toBe('\nword');
    });

    it('should accumulate multiple merges correctly', () => {
        const input = [
            { content: '1', from: 1, to: 1 },
            { content: '2', from: 1, to: 1 },
            { content: '3', from: 1, to: 1 },
            { content: 'long phrase here to stop merge', from: 1, to: 1 },
        ];
        // 1+2 merge -> "1\n2" (length 2 < 5)
        // (1+2)+3 merge -> "1\n2\n3" (length 3 < 5)
        // (1+2+3)+long -> "1\n2\n3\nlong..." (because prev is short? No wait)
        // Logic: isMergable if CURRENT (accumulated) is short OR NEXT is short.
        // Iter 1: current='1', next='2'. Both short. Merge. current='1\n2'
        // Iter 2: current='1\n2', next='3'. Both short. Merge. current='1\n2\n3'
        // Iter 3: current='1\n2\n3', next='long...'. current is short! So it should merge even if next is long.

        const result = segmentation.mergeShortSegments(input as any, 5);
        expect(result).toHaveLength(1);
        expect(result[0].content).toContain('1\n2\n3\nlong');
    });

    it('should stop merging when accumulated content becomes long enough and next is long enough', () => {
        const input = [
            { content: 'one two three', from: 1, to: 1 }, // 3
            { content: 'four five', from: 1, to: 1 }, // 2. Merge -> 5 words. Now current is long.
            { content: 'six seven eight nine ten', from: 1, to: 1 }, // 5 words. Next is long.
        ];
        const result = segmentation.mergeShortSegments(input as any, 5);
        expect(result).toHaveLength(2);
        expect(result[0].content).toBe('one two three\nfour five');
        expect(result[1].content).toBe('six seven eight nine ten');
    });
});
