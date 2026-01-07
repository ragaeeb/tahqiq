import { describe, expect, test } from 'bun:test';
import { parseTranslationLine, parseTranslations } from './excerpts';

describe('Translation Parsing Utilities', () => {
    describe('parseTranslationLine', () => {
        test('parses a simple translation line with hyphen', () => {
            const result = parseTranslationLine('P11622a - Test translation text');

            expect(result).not.toBeNull();
            expect(result?.id).toBe('P11622a');
            expect(result?.text).toBe('Test translation text');
        });

        test('parses a translation line with en dash', () => {
            const result = parseTranslationLine('C11623 – Another translation');

            expect(result).not.toBeNull();
            expect(result?.id).toBe('C11623');
            expect(result?.text).toBe('Another translation');
        });

        test('parses a translation line with em dash', () => {
            const result = parseTranslationLine('B12345—Em dash translation');

            expect(result).not.toBeNull();
            expect(result?.id).toBe('B12345');
            expect(result?.text).toBe('Em dash translation');
        });

        test('handles optional space before dash', () => {
            const result = parseTranslationLine('F999- No space translation');

            expect(result).not.toBeNull();
            expect(result?.id).toBe('F999');
            expect(result?.text).toBe('No space translation');
        });

        test('returns null for non-matching lines', () => {
            const result = parseTranslationLine('This is just regular text');

            expect(result).toBeNull();
        });

        test('handles various marker prefixes', () => {
            const prefixes = ['B', 'C', 'F', 'T', 'P', 'N'];
            for (const prefix of prefixes) {
                const result = parseTranslationLine(`${prefix}123 - Test`);
                expect(result?.id).toBe(`${prefix}123`);
            }
        });

        test('handles suffix letters', () => {
            const result = parseTranslationLine('P11622a - With suffix');

            expect(result?.id).toBe('P11622a');
        });

        test('trims text content', () => {
            const result = parseTranslationLine('P123 -   spaced text   ');

            expect(result?.text).toBe('spaced text');
        });
    });

    describe('parseTranslations', () => {
        test('parses multiple translation entries into a Map', () => {
            const input = `P11622a - First translation
C11623 - Second translation`;

            const result = parseTranslations(input);

            expect(result.count).toBe(2);
            expect(result.translationMap.get('P11622a')).toBe('First translation');
            expect(result.translationMap.get('C11623')).toBe('Second translation');
        });

        test('handles multi-line translations', () => {
            const input = `P11622a - First line of translation
Second line continues here
Third line as well

C11623 - New translation`;

            const result = parseTranslations(input);

            expect(result.count).toBe(2);
            expect(result.translationMap.get('P11622a')).toBe(
                'First line of translation\nSecond line continues here\nThird line as well',
            );
            expect(result.translationMap.get('C11623')).toBe('New translation');
        });

        test('skips empty lines', () => {
            const input = `P123 - Translation


C456 - Another`;

            const result = parseTranslations(input);

            expect(result.count).toBe(2);
        });

        test('returns empty Map for empty input', () => {
            const result = parseTranslations('');
            expect(result.count).toBe(0);
            expect(result.translationMap.size).toBe(0);
        });

        test('ignores lines without valid markers that come before first translation', () => {
            const input = `Some random text
P123 - Actual translation`;

            const result = parseTranslations(input);

            expect(result.count).toBe(1);
            expect(result.translationMap.get('P123')).toBe('Actual translation');
        });

        test('handles large number of translations efficiently', () => {
            // Generate 1000 translations
            const lines: string[] = [];
            for (let i = 0; i < 1000; i++) {
                lines.push(`P${i} - Translation number ${i}`);
            }
            const input = lines.join('\n');

            const start = performance.now();
            const result = parseTranslations(input);
            const elapsed = performance.now() - start;

            expect(result.count).toBe(1000);
            expect(elapsed).toBeLessThan(100); // Should complete in under 100ms
        });

        test('overwrites duplicate IDs with last occurrence', () => {
            const input = `P123 - First version
P123 - Second version`;

            const result = parseTranslations(input);

            expect(result.count).toBe(1);
            expect(result.translationMap.get('P123')).toBe('Second version');
        });
    });
});

describe('Token Estimation Utilities', () => {
    describe('estimateTokenCount', () => {
        test('should estimate tokens for plain English text', async () => {
            const { estimateTokenCount } = await import('./excerpts');
            // ~4 chars per token for Latin text
            const result = estimateTokenCount('Hello world');
            expect(result).toBeGreaterThan(0);
            expect(result).toBe(Math.ceil(11 / 4)); // 3 tokens
        });

        test('should estimate tokens for Arabic base characters', async () => {
            const { estimateTokenCount } = await import('./excerpts');
            // Arabic base: ~2.5 chars/token
            // "السلام عليكم" = 11 Arabic chars + 1 space
            const text = 'السلام عليكم';
            const result = estimateTokenCount(text);
            // 11 Arabic base chars / 2.5 + 1 space / 4 ≈ 5
            expect(result).toBeGreaterThanOrEqual(4);
            expect(result).toBeLessThanOrEqual(6);
        });

        test('should count Arabic diacritics separately', async () => {
            const { estimateTokenCount } = await import('./excerpts');
            // With diacritics: each counts as ~1 token
            const withDiacritics = 'بِسْمِ اللَّهِ';
            const withoutDiacritics = 'بسم الله';

            const tokensWith = estimateTokenCount(withDiacritics);
            const tokensWithout = estimateTokenCount(withoutDiacritics);

            // Diacritized version should have more tokens
            expect(tokensWith).toBeGreaterThan(tokensWithout);
        });

        test('should count tatweel characters', async () => {
            const { estimateTokenCount } = await import('./excerpts');
            // Tatweel: ~1 per token
            const withTatweel = 'الـلـه';
            const withoutTatweel = 'الله';

            const tokensWith = estimateTokenCount(withTatweel);
            const tokensWithout = estimateTokenCount(withoutTatweel);

            // Tatweel version should have 2 extra tokens
            expect(tokensWith).toBeGreaterThan(tokensWithout);
        });

        test('should handle Arabic-Indic numerals', async () => {
            const { estimateTokenCount } = await import('./excerpts');
            // Arabic-Indic numerals: ~4 chars/token (same as Latin)
            const arabicNumerals = '١٢٣٤٥٦٧٨';
            const result = estimateTokenCount(arabicNumerals);
            expect(result).toBe(Math.ceil(8 / 4)); // 2 tokens
        });

        test('should handle mixed content', async () => {
            const { estimateTokenCount } = await import('./excerpts');
            // Mix of Arabic, English, numerals
            const mixed = 'P123 - السلام عليكم';
            const result = estimateTokenCount(mixed);
            expect(result).toBeGreaterThan(0);
        });

        test('should handle empty string', async () => {
            const { estimateTokenCount } = await import('./excerpts');
            const result = estimateTokenCount('');
            expect(result).toBe(0);
        });
    });
});

describe('Prompt Formatting Utilities', () => {
    describe('formatExcerptsForPrompt', () => {
        test('should format excerpts with prompt', async () => {
            const { formatExcerptsForPrompt } = await import('./excerpts');
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

        test('should handle empty excerpts array', async () => {
            const { formatExcerptsForPrompt } = await import('./excerpts');
            const result = formatExcerptsForPrompt([], 'Prompt');
            expect(result).toBe('Prompt\n\n\n');
        });

        test('should use triple newline between prompt and excerpts', async () => {
            const { formatExcerptsForPrompt } = await import('./excerpts');
            const excerpts = [{ from: 1, id: 'P1', nass: 'Test' }];
            const result = formatExcerptsForPrompt(excerpts as any, 'Prompt');
            expect(result).toContain('Prompt\n\n\nP1 - Test');
        });
    });

    describe('getUntranslatedIds', () => {
        test('should return IDs of untranslated excerpts not in sent set', async () => {
            const { getUntranslatedIds } = await import('./excerpts');
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

        test('should return empty array when all are translated', async () => {
            const { getUntranslatedIds } = await import('./excerpts');
            const excerpts = [
                { from: 1, id: 'P1', nass: 'Text 1', text: 'Trans 1' },
                { from: 2, id: 'P2', nass: 'Text 2', text: 'Trans 2' },
            ];
            const result = getUntranslatedIds(excerpts as any, new Set());
            expect(result).toEqual([]);
        });

        test('should return empty array when all untranslated are sent', async () => {
            const { getUntranslatedIds } = await import('./excerpts');
            const excerpts = [
                { from: 1, id: 'P1', nass: 'Text 1' },
                { from: 2, id: 'P2', nass: 'Text 2' },
            ];
            const sentIds = new Set(['P1', 'P2']);
            const result = getUntranslatedIds(excerpts as any, sentIds);
            expect(result).toEqual([]);
        });

        test('should handle empty excerpts array', async () => {
            const { getUntranslatedIds } = await import('./excerpts');
            const result = getUntranslatedIds([], new Set());
            expect(result).toEqual([]);
        });
    });
});
