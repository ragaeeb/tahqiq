import { describe, expect, it } from 'bun:test';
import { formatExcerptsForPrompt, getUntranslatedIds } from './segmentation';

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
        expect(result).toBe('Prompt\n\n\n');
    });

    it('should use triple newline between prompt and excerpts', async () => {
        const excerpts = [{ from: 1, id: 'P1', nass: 'Test' }];
        const result = formatExcerptsForPrompt(excerpts as any, 'Prompt');
        expect(result).toContain('Prompt\n\n\nP1 - Test');
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

import { type DebugMeta, getMetaKey, getSegmentFilterKey, summarizeRulePattern } from './segmentation';

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
