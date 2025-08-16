import { describe, expect, it } from 'bun:test';

import { findFirstTokenForText, preformatArabicText } from './textUtils';

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

    describe('findFirstTokenForText', () => {
        const createToken = (text: string, start: number, end: number) => ({
            end,
            start,
            text,
            type: 'word' as const,
        });

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
});
