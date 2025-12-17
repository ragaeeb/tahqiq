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
