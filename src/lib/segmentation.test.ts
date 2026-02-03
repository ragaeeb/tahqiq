import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';
import type { ValidationError } from 'wobble-bibble';
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

describe('getUntranslatedIds', () => {
    it('should return IDs of untranslated excerpts not in sent set', async () => {
        const excerpts = [
            { from: 1, id: 'P1', nass: 'Text 1' },
            { from: 2, id: 'P2', nass: 'Text 2', text: 'Translated' },
            { from: 3, id: 'P3', nass: 'Text 3' },
            { from: 4, id: 'P4', nass: 'Text 4' },
        ];
        const sentIds = new Set(['P3']);

        const result = segmentation.getUntranslatedIds(excerpts as any, sentIds);

        expect(result).toEqual(['P1', 'P4']);
        expect(result).not.toContain('P2'); // Has translation
        expect(result).not.toContain('P3'); // Already sent
    });

    it('should return empty array when all are translated', async () => {
        const excerpts = [
            { from: 1, id: 'P1', nass: 'Text 1', text: 'Trans 1' },
            { from: 2, id: 'P2', nass: 'Text 2', text: 'Trans 2' },
        ];
        const result = segmentation.getUntranslatedIds(excerpts as any, new Set());
        expect(result).toEqual([]);
    });

    it('should return empty array when all untranslated are sent', async () => {
        const excerpts = [
            { from: 1, id: 'P1', nass: 'Text 1' },
            { from: 2, id: 'P2', nass: 'Text 2' },
        ];
        const sentIds = new Set(['P1', 'P2']);
        const result = segmentation.getUntranslatedIds(excerpts as any, sentIds);
        expect(result).toEqual([]);
    });

    it('should handle empty excerpts array', async () => {
        const result = segmentation.getUntranslatedIds([], new Set());
        expect(result).toEqual([]);
    });
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

    describe('summarizeRulePattern', () => {
        it('should return empty string for null/invalid rule', () => {
            expect(segmentation.summarizeRulePattern(null)).toBe('');
            expect(segmentation.summarizeRulePattern(undefined)).toBe('');
            expect(segmentation.summarizeRulePattern('not-obj')).toBe('');
        });

        it('should summarize lineStartsWith array', () => {
            expect(segmentation.summarizeRulePattern({ lineStartsWith: ['### '] })).toBe('### ');
            expect(segmentation.summarizeRulePattern({ lineStartsWith: ['-', '*'] })).toBe('- (+1)');
        });

        it('should summarize lineStartsAfter array', () => {
            expect(segmentation.summarizeRulePattern({ lineStartsAfter: ['.'] })).toBe('.');
            expect(segmentation.summarizeRulePattern({ lineStartsAfter: ['.', '?', '!'] })).toBe('. (+2)');
        });

        it('should summarize lineEndsWith array', () => {
            expect(segmentation.summarizeRulePattern({ lineEndsWith: [':'] })).toBe(':');
            expect(segmentation.summarizeRulePattern({ lineEndsWith: [':', ';'] })).toBe(': (+1)');
        });

        it('should return template string', () => {
            expect(segmentation.summarizeRulePattern({ template: '{{char}}' })).toBe('{{char}}');
        });

        it('should return regex string', () => {
            expect(segmentation.summarizeRulePattern({ regex: '\\d+' })).toBe('\\d+');
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

        it('should return rule-only when meta is undefined', () => {
            expect(segmentation.getSegmentFilterKey(undefined)).toBe('rule-only');
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

describe('buildCorpusSnapshot', () => {
    it('should build segments from excerpts, headings, and footnotes', () => {
        const excerpts = [
            { id: 'P1', nass: 'Arabic text 1' },
            { id: 'P2', nass: 'Arabic text 2' },
        ];
        const headings = [{ id: 'T1', nass: 'Heading nass' }];
        const footnotes = [{ id: 'F1', nass: 'Footnote nass' }];

        const result = segmentation.buildCorpusSnapshot(excerpts as any, headings as any, footnotes as any);

        expect(result.untranslated).toEqual([
            { id: 'P1', text: 'Arabic text 1' },
            { id: 'P2', text: 'Arabic text 2' },
            { id: 'T1', text: 'Heading nass' },
            { id: 'F1', text: 'Footnote nass' },
        ]);
        expect(result.translatedIds).toBeInstanceOf(Set);
        expect(result.translatedIds.size).toBe(0);
    });

    it('should track translated IDs', () => {
        const excerpts = [
            { id: 'P1', nass: 'Arabic 1', text: 'English 1' },
            { id: 'P2', nass: 'Arabic 2' },
        ];
        const result = segmentation.buildCorpusSnapshot(excerpts as any, [], []);
        expect(result.translatedIds.has('P1')).toBe(true);
        expect(result.translatedIds.has('P2')).toBe(false);
        expect(result.untranslated).toEqual([{ id: 'P2', text: 'Arabic 2' }]);
    });

    it('should return empty snapshot for empty inputs', () => {
        const result = segmentation.buildCorpusSnapshot([], [], []);
        expect(result.untranslated).toEqual([]);
        expect(result.translatedIds.size).toBe(0);
    });
});

describe('errorsToHighlights', () => {
    it('should return empty array for empty errors', () => {
        expect(segmentation.errorsToHighlights([])).toEqual([]);
    });

    it('should convert error ranges to highlight objects', () => {
        const errors: ValidationError[] = [
            { matchText: 'test', message: 'Arabic', range: { end: 10, start: 0 }, type: 'arabic_leak' },
            { matchText: 'test2', message: 'Dup', range: { end: 30, start: 20 }, type: 'duplicate_id' },
        ];
        const highlights = segmentation.errorsToHighlights(errors);

        expect(highlights).toHaveLength(2);
        expect(highlights[0]).toEqual({ className: 'bg-red-200', end: 10, start: 0 });
        expect(highlights[1]).toEqual({ className: 'bg-red-200', end: 30, start: 20 });
    });

    it('should preserve exact range boundaries', () => {
        const errors: ValidationError[] = [
            { matchText: 'exact', message: 'Test', range: { end: 15, start: 5 }, type: 'test' as any },
        ];
        const [highlight] = segmentation.errorsToHighlights(errors);

        expect(highlight.start).toBe(5);
        expect(highlight.end).toBe(15);
    });
});

describe('detectTruncatedTranslation', () => {
    it('should return undefined for valid translations', () => {
        // Arabic 100 chars, English 150 chars - well above 25% ratio
        const arabic =
            'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي الذي يحتاج إلى ترجمة';
        const english =
            'This is a long Arabic text that contains sufficient content for translation and represents a full paragraph of Arabic text.';
        expect(segmentation.detectTruncatedTranslation(arabic, english)).toBeUndefined();
    });

    it('should return undefined for short Arabic texts', () => {
        // Short Arabic should be exempt from check
        const arabic = 'نعم';
        const english = 'Yes';
        expect(segmentation.detectTruncatedTranslation(arabic, english)).toBeUndefined();
    });

    it('should detect empty translation with substantial Arabic', () => {
        const arabic =
            'هذا نص عربي طويل جداً يحتوي على فقرة كاملة من الكلام العربي الذي يحتاج إلى ترجمة وافية ولكن الترجمة فارغة تماماً';
        const english = '';
        const error = segmentation.detectTruncatedTranslation(arabic, english);
        expect(error).toBeDefined();
        expect(error).toContain('empty');
    });

    it('should detect truncated translation', () => {
        // Arabic ~500 chars, English only 30 chars (6% ratio, well below 25%)
        const arabic =
            'هو هذا الذي يسمونه بالمضاف المحذوف، أي أهل القرية، أهل العير هذا الذي يتبادر إلى الذهن، إذن هذا المعنى المتبادر الى الذهن هو المعنى الحقيقي، فليس هذا تأويلا وليس هذا مجازا، لأنه المعنى الحقيقي هو الذي يتبادر إلى ذهن الإنسان مباشرة، لكن يقوم هناك دليل في الشرع أو في العقل يمنعه من أن يفهم هذا المعنى';
        const english = 'Questioner: May Allah bless you.';
        const error = segmentation.detectTruncatedTranslation(arabic, english);
        expect(error).toBeDefined();
        expect(error).toContain('truncated');
    });

    it('should handle null/undefined inputs', () => {
        expect(segmentation.detectTruncatedTranslation(null, 'text')).toBeUndefined();
        expect(segmentation.detectTruncatedTranslation(undefined, 'text')).toBeUndefined();
        expect(segmentation.detectTruncatedTranslation('', '')).toBeUndefined();
    });
});

describe('findExcerptIssues', () => {
    describe('gap detection', () => {
        it('should find a gap surrounded by translations', () => {
            const items = [
                { id: 'P1', text: 'Translation' },
                { id: 'P2', text: '' }, // Gap
                { id: 'P3', text: 'Translation' },
            ];
            const result = segmentation.findExcerptIssues(items as any);
            expect(result).toContain('P2');
        });

        it('should find multiple consecutive gaps (up to 3)', () => {
            const items = [
                { id: 'P1', text: 'Trans' },
                { id: 'P2', text: '' },
                { id: 'P3', text: '' },
                { id: 'P4', text: '' },
                { id: 'P5', text: 'Trans' },
            ];
            const result = segmentation.findExcerptIssues(items as any);
            expect(result).toContain('P2');
            expect(result).toContain('P3');
            expect(result).toContain('P4');
        });

        it('should NOT flag more than 3 consecutive gaps', () => {
            const items = [
                { id: 'P1', text: 'Trans' },
                { id: 'P2', text: '' },
                { id: 'P3', text: '' },
                { id: 'P4', text: '' },
                { id: 'P5', text: '' }, // 4 gaps - too many to flag
                { id: 'P6', text: 'Trans' },
            ];
            const result = segmentation.findExcerptIssues(items as any);
            expect(result).not.toContain('P2');
            expect(result).not.toContain('P3');
            expect(result).not.toContain('P4');
            expect(result).not.toContain('P5');
        });

        it('should NOT flag gaps at the start (no prev translation)', () => {
            const items = [
                { id: 'P1', text: '' },
                { id: 'P2', text: '' },
                { id: 'P3', text: 'Trans' },
            ];
            const result = segmentation.findExcerptIssues(items as any);
            expect(result).not.toContain('P1');
            expect(result).not.toContain('P2');
        });

        it('should NOT flag gaps at the end (no next translation)', () => {
            const items = [
                { id: 'P1', text: 'Trans' },
                { id: 'P2', text: '' },
                { id: 'P3', text: '' },
            ];
            const result = segmentation.findExcerptIssues(items as any);
            expect(result).not.toContain('P2');
            expect(result).not.toContain('P3');
        });
    });

    describe('truncation detection', () => {
        it('should flag truncated translations', () => {
            const items = [
                {
                    id: 'P1',
                    nass: 'هذا نص عربي طويل جداً يحتوي على فقرة كاملة من الكلام العربي الذي يحتاج إلى ترجمة وافية ولكن الترجمة قصيرة جداً',
                    text: 'Too short.',
                },
            ];
            const result = segmentation.findExcerptIssues(items as any);
            expect(result).toContain('P1');
        });

        it('should NOT flag empty translations (those are gaps, not truncated)', () => {
            const items = [{ id: 'P1', nass: 'هذا نص عربي طويل جداً يحتوي على محتوى كافٍ', text: '' }];
            const result = segmentation.findExcerptIssues(items as any);
            expect(result).not.toContain('P1');
        });

        it('should NOT flag adequate translations', () => {
            const items = [
                {
                    id: 'P1',
                    nass: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة',
                    text: 'This is a long Arabic text that contains sufficient content for translation.',
                },
            ];
            const result = segmentation.findExcerptIssues(items as any);
            expect(result).not.toContain('P1');
        });
    });

    describe('combined issues', () => {
        it('should find both gaps and truncations', () => {
            const items = [
                { id: 'P1', text: 'Trans' },
                { id: 'P2', text: '' }, // Gap
                { id: 'P3', text: 'Trans' },
                { id: 'P4', nass: 'نص عربي طويل جداً يحتوي على كلام كثير جداً ويحتاج ترجمة كاملة', text: 'Short.' }, // Truncated
            ];
            const result = segmentation.findExcerptIssues(items as any);
            expect(result).toContain('P2'); // Gap
            expect(result).toContain('P4'); // Truncated
        });

        it('should return empty array when no issues', () => {
            const items = [
                { id: 'P1', text: 'Trans 1' },
                { id: 'P2', text: 'Trans 2' },
                { id: 'P3', text: 'Trans 3' },
            ];
            const result = segmentation.findExcerptIssues(items as any);
            expect(result).toEqual([]);
        });

        it('should handle empty input', () => {
            const result = segmentation.findExcerptIssues([]);
            expect(result).toEqual([]);
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
