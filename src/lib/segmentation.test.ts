import { describe, expect, it } from 'bun:test';
import { detectMergeableShortExcerpts, formatExcerptsForPrompt, getUntranslatedIds } from './segmentation';

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
