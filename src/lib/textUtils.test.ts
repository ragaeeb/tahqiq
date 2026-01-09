import { describe, expect, it } from 'bun:test';

import {
    countWords,
    estimateTokenCount,
    findFirstTokenForText,
    parseTranslationLine,
    parseTranslations,
    preformatArabicText,
} from './textUtils';

describe('textUtils', () => {
    describe('preformatArabicText', () => {
        it('should apply basic formatting pipeline', () => {
            const input = 'test   text\n\n\nwith   spaces';
            const result = preformatArabicText(input);

            // Should normalize spaces and clean multilines
            expect(result).toContain('test text');
        });

        it('should apply autocorrect when enabled', () => {
            const input = '123ه and اه';
            const result = preformatArabicText(input, true);

            expect(result).toContain('123 هـ');
            expect(result).toContain('اهـ');
        });

        it('should not apply autocorrect when disabled', () => {
            const input = '123ه';
            const result = preformatArabicText(input, false);

            // Should still contain original ه (not transformed to هـ)
            expect(result).toContain('ه');
        });

        it('should handle empty string', () => {
            expect(preformatArabicText('')).toBe('');
        });

        it('should handle multiple formatting issues', () => {
            const input = 'text(«content»)with123هandاه';
            const result = preformatArabicText(input, true);

            expect(result).toContain('«content»');
            expect(result).toContain('123 هـ');
            expect(result).toContain('اهـ');
        });
    });

    describe('estimateTokenCount', () => {
        it('should estimate tokens for plain English text', async () => {
            // ~4 chars per token for Latin text
            const result = estimateTokenCount('Hello world');
            expect(result).toBeGreaterThan(0);
            expect(result).toBe(Math.ceil(11 / 4)); // 3 tokens
        });

        it('should estimate tokens for Arabic base characters', async () => {
            // Arabic base: ~2.5 chars/token
            // "السلام عليكم" = 11 Arabic chars + 1 space
            const text = 'السلام عليكم';
            const result = estimateTokenCount(text);
            // 11 Arabic base chars / 2.5 + 1 space / 4 ≈ 5
            expect(result).toBeGreaterThanOrEqual(4);
            expect(result).toBeLessThanOrEqual(6);
        });

        it('should count Arabic diacritics separately', async () => {
            // With diacritics: each counts as ~1 token
            const withDiacritics = 'بِسْمِ اللَّهِ';
            const withoutDiacritics = 'بسم الله';

            const tokensWith = estimateTokenCount(withDiacritics);
            const tokensWithout = estimateTokenCount(withoutDiacritics);

            // Diacritized version should have more tokens
            expect(tokensWith).toBeGreaterThan(tokensWithout);
        });

        it('should count tatweel characters', async () => {
            // Tatweel: ~1 per token
            const withTatweel = 'الـلـه';
            const withoutTatweel = 'الله';

            const tokensWith = estimateTokenCount(withTatweel);
            const tokensWithout = estimateTokenCount(withoutTatweel);

            // Tatweel version should have 2 extra tokens
            expect(tokensWith).toBeGreaterThan(tokensWithout);
        });

        it('should handle Arabic-Indic numerals', async () => {
            // Arabic-Indic numerals: ~4 chars/token (same as Latin)
            const arabicNumerals = '١٢٣٤٥٦٧٨';
            const result = estimateTokenCount(arabicNumerals);
            expect(result).toBe(Math.ceil(8 / 4)); // 2 tokens
        });

        it('should handle mixed content', async () => {
            // Mix of Arabic, English, numerals
            const mixed = 'P123 - السلام عليكم';
            const result = estimateTokenCount(mixed);
            expect(result).toBeGreaterThan(0);
        });

        it('should handle empty string', async () => {
            const result = estimateTokenCount('');
            expect(result).toBe(0);
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

    describe('findFirstTokenForText', () => {
        const createToken = (text: string, start: number, end: number) => ({ end, start, text, type: 'word' as const });

        it('should find single word match', () => {
            const tokens = [createToken('hello', 0, 5), createToken('world', 6, 11), createToken('test', 12, 16)];

            const result = findFirstTokenForText(tokens, 'world');
            expect(result).toEqual(tokens[1]);
        });

        it('should find multi-word match', () => {
            const tokens = [createToken('hello', 0, 5), createToken('world', 6, 11), createToken('test', 12, 16)];

            const result = findFirstTokenForText(tokens, 'hello world');
            expect(result).toEqual(tokens[0]);
        });

        it('should return null when no match found', () => {
            const tokens = [createToken('hello', 0, 5), createToken('world', 6, 11)];

            const result = findFirstTokenForText(tokens, 'missing');
            expect(result).toBeNull();
        });

        it('should handle partial match followed by mismatch', () => {
            const tokens = [createToken('hello', 0, 5), createToken('there', 6, 11), createToken('world', 12, 17)];

            const result = findFirstTokenForText(tokens, 'hello world');
            expect(result).toBeNull();
        });

        it('should find match at the end of tokens', () => {
            const tokens = [createToken('start', 0, 5), createToken('hello', 6, 11), createToken('world', 12, 17)];

            const result = findFirstTokenForText(tokens, 'hello world');
            expect(result).toEqual(tokens[1]);
        });

        it('should handle empty selected text', () => {
            const tokens = [createToken('hello', 0, 5)];

            const result = findFirstTokenForText(tokens, '');
            expect(result).toBeNull();
        });

        it('should handle empty tokens array', () => {
            const result = findFirstTokenForText([], 'hello');
            expect(result).toBeNull();
        });

        it('should handle single word tokens with punctuation at different positions', () => {
            const tokens = [createToken('first.', 0, 6), createToken('second', 7, 13), createToken('third!', 14, 20)];

            const result = findFirstTokenForText(tokens, 'first second third');
            expect(result).toEqual(tokens[0]);
        });

        it('should handle case where selected text is longer than available tokens', () => {
            const tokens = [createToken('short', 0, 5)];

            const result = findFirstTokenForText(tokens, 'short text that is longer');
            expect(result).toBeNull();
        });
    });

    describe('parseTranslations', () => {
        it('parses multiple translation entries into a Map', () => {
            const input = `P11622a - First translation
C11623 - Second translation`;

            const result = parseTranslations(input);

            expect(result.count).toBe(2);
            expect(result.translationMap.get('P11622a')).toBe('First translation');
            expect(result.translationMap.get('C11623')).toBe('Second translation');
        });

        it('handles multi-line translations', () => {
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

        it('skips empty lines', () => {
            const input = `P123 - Translation


C456 - Another`;

            const result = parseTranslations(input);

            expect(result.count).toBe(2);
        });

        it('returns empty Map for empty input', () => {
            const result = parseTranslations('');
            expect(result.count).toBe(0);
            expect(result.translationMap.size).toBe(0);
        });

        it('ignores lines without valid markers that come before first translation', () => {
            const input = `Some random text
P123 - Actual translation`;

            const result = parseTranslations(input);

            expect(result.count).toBe(1);
            expect(result.translationMap.get('P123')).toBe('Actual translation');
        });

        it('handles large number of translations efficiently', () => {
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

        it('overwrites duplicate IDs with last occurrence', () => {
            const input = `P123 - First version
P123 - Second version`;

            const result = parseTranslations(input);

            expect(result.count).toBe(1);
            expect(result.translationMap.get('P123')).toBe('Second version');
        });
    });

    describe('parseTranslationLine', () => {
        it('parses a simple translation line with hyphen', () => {
            const result = parseTranslationLine('P11622a - Test translation text');

            expect(result).not.toBeNull();
            expect(result?.id).toBe('P11622a');
            expect(result?.text).toBe('Test translation text');
        });

        it('parses a translation line with en dash', () => {
            const result = parseTranslationLine('C11623 – Another translation');

            expect(result).not.toBeNull();
            expect(result?.id).toBe('C11623');
            expect(result?.text).toBe('Another translation');
        });

        it('parses a translation line with em dash', () => {
            const result = parseTranslationLine('B12345—Em dash translation');

            expect(result).not.toBeNull();
            expect(result?.id).toBe('B12345');
            expect(result?.text).toBe('Em dash translation');
        });

        it('handles optional space before dash', () => {
            const result = parseTranslationLine('F999- No space translation');

            expect(result).not.toBeNull();
            expect(result?.id).toBe('F999');
            expect(result?.text).toBe('No space translation');
        });

        it('returns null for non-matching lines', () => {
            const result = parseTranslationLine('This is just regular text');

            expect(result).toBeNull();
        });

        it('handles various marker prefixes', () => {
            const prefixes = ['B', 'C', 'F', 'T', 'P', 'N'];
            for (const prefix of prefixes) {
                const result = parseTranslationLine(`${prefix}123 - Test`);
                expect(result?.id).toBe(`${prefix}123`);
            }
        });

        it('handles suffix letters', () => {
            const result = parseTranslationLine('P11622a - With suffix');

            expect(result?.id).toBe('P11622a');
        });

        it('trims text content', () => {
            const result = parseTranslationLine('P123 -   spaced text   ');

            expect(result?.text).toBe('spaced text');
        });
    });
});
