import { describe, expect, it } from 'bun:test';
import {
    buildExistingTranslationsMap,
    buildValidationSegments,
    type DebugMeta,
    detectTruncatedTranslation,
    findExcerptIssues,
    formatExcerptsForPrompt,
    formatValidationErrors,
    getMetaKey,
    getSegmentFilterKey,
    getUntranslatedIds,
    summarizeRulePattern,
} from './segmentation';

describe('formatExcerptsForPrompt', () => {
    it('should format excerpts with prompt', async () => {
        const excerpts = [
            { from: 1, id: 'P1', nass: 'النص الأول' },
            { from: 2, id: 'P2', nass: 'النص الثاني' },
        ];
        const prompt = 'Translate the following:';

        const result = formatExcerptsForPrompt(excerpts as any, prompt);

        expect(result).toContain('Translate the following:');
        expect(result).toContain('P1 - النص الأول');
        expect(result).toContain('P2 - النص الثاني');
        // Excerpts should be separated by double newlines
        expect(result).toContain('\n\n');
    });

    it('should handle empty excerpts array', async () => {
        const result = formatExcerptsForPrompt([], 'Prompt');
        expect(result).toBe('Prompt\n\n');
    });

    it('should use triple newline between prompt and excerpts', async () => {
        const excerpts = [{ from: 1, id: 'P1', nass: 'Test' }];
        const result = formatExcerptsForPrompt(excerpts as any, 'Prompt');
        expect(result).toContain('Prompt\n\nP1 - Test');
    });
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

        const result = getUntranslatedIds(excerpts as any, sentIds);

        expect(result).toEqual(['P1', 'P4']);
        expect(result).not.toContain('P2'); // Has translation
        expect(result).not.toContain('P3'); // Already sent
    });

    it('should return empty array when all are translated', async () => {
        const excerpts = [
            { from: 1, id: 'P1', nass: 'Text 1', text: 'Trans 1' },
            { from: 2, id: 'P2', nass: 'Text 2', text: 'Trans 2' },
        ];
        const result = getUntranslatedIds(excerpts as any, new Set());
        expect(result).toEqual([]);
    });

    it('should return empty array when all untranslated are sent', async () => {
        const excerpts = [
            { from: 1, id: 'P1', nass: 'Text 1' },
            { from: 2, id: 'P2', nass: 'Text 2' },
        ];
        const sentIds = new Set(['P1', 'P2']);
        const result = getUntranslatedIds(excerpts as any, sentIds);
        expect(result).toEqual([]);
    });

    it('should handle empty excerpts array', async () => {
        const result = getUntranslatedIds([], new Set());
        expect(result).toEqual([]);
    });
});

describe('Debug Metadata Utilities', () => {
    describe('getMetaKey', () => {
        it('should return _flappa when debug is true', () => {
            expect(getMetaKey(true)).toBe('_flappa');
        });

        it('should return _flappa when debug is undefined/false/null', () => {
            expect(getMetaKey(undefined)).toBe('_flappa');
            expect(getMetaKey(false)).toBe('_flappa');
            expect(getMetaKey(null)).toBe('_flappa');
        });

        it('should return custom metaKey when provided in debug object', () => {
            expect(getMetaKey({ metaKey: 'custom_key' })).toBe('custom_key');
        });

        it('should fallback to _flappa if debug object lacks metaKey string', () => {
            expect(getMetaKey({})).toBe('_flappa');
            expect(getMetaKey({ metaKey: 123 })).toBe('_flappa');
        });
    });

    describe('summarizeRulePattern', () => {
        it('should return empty string for null/invalid rule', () => {
            expect(summarizeRulePattern(null)).toBe('');
            expect(summarizeRulePattern(undefined)).toBe('');
            expect(summarizeRulePattern('not-obj')).toBe('');
        });

        it('should summarize lineStartsWith array', () => {
            expect(summarizeRulePattern({ lineStartsWith: ['### '] })).toBe('### ');
            expect(summarizeRulePattern({ lineStartsWith: ['-', '*'] })).toBe('- (+1)');
        });

        it('should summarize lineStartsAfter array', () => {
            expect(summarizeRulePattern({ lineStartsAfter: ['.'] })).toBe('.');
            expect(summarizeRulePattern({ lineStartsAfter: ['.', '?', '!'] })).toBe('. (+2)');
        });

        it('should summarize lineEndsWith array', () => {
            expect(summarizeRulePattern({ lineEndsWith: [':'] })).toBe(':');
            expect(summarizeRulePattern({ lineEndsWith: [':', ';'] })).toBe(': (+1)');
        });

        it('should return template string', () => {
            expect(summarizeRulePattern({ template: '{{char}}' })).toBe('{{char}}');
        });

        it('should return regex string', () => {
            expect(summarizeRulePattern({ regex: '\\d+' })).toBe('\\d+');
        });
    });

    describe('getSegmentFilterKey', () => {
        it('should return contentLengthSplit reason', () => {
            const meta: DebugMeta = { contentLengthSplit: { maxContentLength: 5000, splitReason: 'whitespace' } };
            expect(getSegmentFilterKey(meta)).toBe('contentLengthSplit:whitespace');
        });

        it('should return breakpoint pattern', () => {
            const meta: DebugMeta = { breakpoint: { index: 0, kind: 'pattern', pattern: '{{tarqim}}' } };
            expect(getSegmentFilterKey(meta)).toBe('breakpoint:{{tarqim}}');
        });

        it('should return rule-only when no special split', () => {
            const meta: DebugMeta = { rule: { index: 0, patternType: 'lineStartsWith' } };
            expect(getSegmentFilterKey(meta)).toBe('rule-only');
        });

        it('should return rule-only when meta is undefined', () => {
            expect(getSegmentFilterKey(undefined)).toBe('rule-only');
        });

        it('should prioritize contentLengthSplit over breakpoint if both exist (rare)', () => {
            const meta: DebugMeta = {
                breakpoint: { index: 0, kind: 'pattern', pattern: 'foo' },
                contentLengthSplit: { maxContentLength: 100, splitReason: 'unicode_boundary' },
            };
            expect(getSegmentFilterKey(meta)).toBe('contentLengthSplit:unicode_boundary');
        });
    });
});

describe('buildValidationSegments', () => {
    it('should build segments from excerpts, headings, and footnotes', () => {
        const excerpts = [
            { id: 'P1', nass: 'Arabic text 1' },
            { id: 'P2', nass: 'Arabic text 2' },
        ];
        const headings = [{ id: 'T1', nass: 'Heading nass' }];
        const footnotes = [{ id: 'F1', nass: 'Footnote nass' }];

        const result = buildValidationSegments(excerpts, headings, footnotes);

        expect(result).toEqual([
            { id: 'P1', text: 'Arabic text 1' },
            { id: 'P2', text: 'Arabic text 2' },
            { id: 'T1', text: 'Heading nass' },
            { id: 'F1', text: 'Footnote nass' },
        ]);
    });

    it('should skip items without nass', () => {
        const excerpts = [
            { id: 'P1', nass: 'Has nass' },
            { id: 'P2', nass: null },
            { id: 'P3', nass: undefined },
            { id: 'P4' }, // no nass property
        ];

        const result = buildValidationSegments(excerpts as any, [], []);

        expect(result).toEqual([{ id: 'P1', text: 'Has nass' }]);
    });

    it('should return empty array for empty inputs', () => {
        const result = buildValidationSegments([], [], []);
        expect(result).toEqual([]);
    });

    it('should handle empty string nass as falsy', () => {
        const excerpts = [{ id: 'P1', nass: '' }];
        const result = buildValidationSegments(excerpts, [], []);
        expect(result).toEqual([]);
    });
});

describe('buildExistingTranslationsMap', () => {
    it('should map IDs with non-empty text', () => {
        const excerpts = [
            { id: 'P1', text: 'Translated' },
            { id: 'P2', text: '' },
            { id: 'P3', text: '   ' }, // whitespace only
            { id: 'P4' }, // no text
        ];

        const result = buildExistingTranslationsMap(excerpts as any, [], []);

        expect(result.has('P1')).toBe(true);
        expect(result.has('P2')).toBe(false);
        expect(result.has('P3')).toBe(false);
        expect(result.has('P4')).toBe(false);
    });

    it('should include headings and footnotes', () => {
        const excerpts = [{ id: 'P1', text: 'Trans' }];
        const headings = [{ id: 'T1', text: 'Heading trans' }];
        const footnotes = [{ id: 'F1', text: 'Footnote trans' }];

        const result = buildExistingTranslationsMap(excerpts, headings, footnotes);

        expect(result.has('P1')).toBe(true);
        expect(result.has('T1')).toBe(true);
        expect(result.has('F1')).toBe(true);
    });

    it('should return empty map for no translations', () => {
        const excerpts = [{ id: 'P1' }, { id: 'P2', text: '' }];
        const result = buildExistingTranslationsMap(excerpts as any, [], []);
        expect(result.size).toBe(0);
    });
});

describe('formatValidationErrors', () => {
    it('should return empty string for empty errors array', () => {
        expect(formatValidationErrors([])).toBe('');
    });

    it('should format error with ID', () => {
        const errors = [{ id: 'P123', message: 'Segment appears truncated', type: 'truncated_segment' }];
        const result = formatValidationErrors(errors);
        expect(result).toContain('P123');
    });

    it('should use VALIDATION_ERROR_TYPE_INFO description when available', () => {
        const errors = [{ id: 'P1', message: 'fallback', type: 'arabic_leak' }];
        const result = formatValidationErrors(errors);
        // Should use the VALIDATION_ERROR_TYPE_INFO description, not the fallback
        expect(result).toContain('Arabic script');
    });

    it('should fallback to message when type is unknown', () => {
        const errors = [{ message: 'Custom fallback message', type: 'unknown_type' }];
        const result = formatValidationErrors(errors);
        expect(result).toBe('Custom fallback message');
    });

    it('should format all errors with newlines', () => {
        const errors = [
            { id: 'P1', message: 'First', type: 'arabic_leak' },
            { id: 'P2', message: 'Second', type: 'duplicate_id' },
        ];
        const result = formatValidationErrors(errors);
        expect(result).toContain('P1');
        expect(result).toContain('P2');
        expect(result).toContain('\n');
        // Verify the structure: each error on its own line
        const lines = result.split('\n');
        expect(lines.length).toBe(2);
    });
});

describe('detectTruncatedTranslation', () => {
    it('should return undefined for valid translations', () => {
        // Arabic 100 chars, English 150 chars - well above 25% ratio
        const arabic =
            'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي الذي يحتاج إلى ترجمة';
        const english =
            'This is a long Arabic text that contains sufficient content for translation and represents a full paragraph of Arabic text.';
        expect(detectTruncatedTranslation(arabic, english)).toBeUndefined();
    });

    it('should return undefined for short Arabic texts', () => {
        // Short Arabic should be exempt from check
        const arabic = 'نعم';
        const english = 'Yes';
        expect(detectTruncatedTranslation(arabic, english)).toBeUndefined();
    });

    it('should detect empty translation with substantial Arabic', () => {
        const arabic =
            'هذا نص عربي طويل جداً يحتوي على فقرة كاملة من الكلام العربي الذي يحتاج إلى ترجمة وافية ولكن الترجمة فارغة تماماً';
        const english = '';
        const error = detectTruncatedTranslation(arabic, english);
        expect(error).toBeDefined();
        expect(error).toContain('empty');
    });

    it('should detect truncated translation', () => {
        // Arabic ~500 chars, English only 30 chars (6% ratio, well below 25%)
        const arabic =
            'هو هذا الذي يسمونه بالمضاف المحذوف، أي أهل القرية، أهل العير هذا الذي يتبادر إلى الذهن، إذن هذا المعنى المتبادر الى الذهن هو المعنى الحقيقي، فليس هذا تأويلا وليس هذا مجازا، لأنه المعنى الحقيقي هو الذي يتبادر إلى ذهن الإنسان مباشرة، لكن يقوم هناك دليل في الشرع أو في العقل يمنعه من أن يفهم هذا المعنى';
        const english = 'Questioner: May Allah bless you.';
        const error = detectTruncatedTranslation(arabic, english);
        expect(error).toBeDefined();
        expect(error).toContain('truncated');
    });

    it('should handle null/undefined inputs', () => {
        expect(detectTruncatedTranslation(null, 'text')).toBeUndefined();
        expect(detectTruncatedTranslation(undefined, 'text')).toBeUndefined();
        expect(detectTruncatedTranslation('', '')).toBeUndefined();
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
            const result = findExcerptIssues(items);
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
            const result = findExcerptIssues(items);
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
            const result = findExcerptIssues(items);
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
            const result = findExcerptIssues(items);
            expect(result).not.toContain('P1');
            expect(result).not.toContain('P2');
        });

        it('should NOT flag gaps at the end (no next translation)', () => {
            const items = [
                { id: 'P1', text: 'Trans' },
                { id: 'P2', text: '' },
                { id: 'P3', text: '' },
            ];
            const result = findExcerptIssues(items);
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
            const result = findExcerptIssues(items);
            expect(result).toContain('P1');
        });

        it('should NOT flag empty translations (those are gaps, not truncated)', () => {
            const items = [{ id: 'P1', nass: 'هذا نص عربي طويل جداً يحتوي على محتوى كافٍ', text: '' }];
            const result = findExcerptIssues(items);
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
            const result = findExcerptIssues(items);
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
            const result = findExcerptIssues(items);
            expect(result).toContain('P2'); // Gap
            expect(result).toContain('P4'); // Truncated
        });

        it('should return empty array when no issues', () => {
            const items = [
                { id: 'P1', text: 'Trans 1' },
                { id: 'P2', text: 'Trans 2' },
                { id: 'P3', text: 'Trans 3' },
            ];
            const result = findExcerptIssues(items);
            expect(result).toEqual([]);
        });

        it('should handle empty input', () => {
            const result = findExcerptIssues([]);
            expect(result).toEqual([]);
        });
    });
});
