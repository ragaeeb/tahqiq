import { describe, expect, it } from 'bun:test';

import {
    findFirstTokenForText,
    parsePageRanges,
    preformatArabicText,
    standardizeAhHijriSymbol,
    standardizeHijriSymbol,
} from './textUtils';

describe('textUtils', () => {
    describe('standardizeHijriSymbol', () => {
        it('should replace standalone ه with هـ after Arabic digits', () => {
            expect(standardizeHijriSymbol('١٢٣ه')).toBe('١٢٣ هـ');
            expect(standardizeHijriSymbol('123ه')).toBe('123 هـ');
        });

        it('should replace ه with هـ when there is one space between digit and ه', () => {
            expect(standardizeHijriSymbol('١٢٣ ه')).toBe('١٢٣ هـ');
            expect(standardizeHijriSymbol('456 ه')).toBe('456 هـ');
        });

        it('should replace ه at end of string', () => {
            expect(standardizeHijriSymbol('١٢٣ه')).toBe('١٢٣ هـ');
        });

        it('should replace ه before whitespace', () => {
            expect(standardizeHijriSymbol('١٢٣ه والبقية')).toBe('١٢٣ هـ والبقية');
        });

        it('should replace ه before non-Arabic characters', () => {
            expect(standardizeHijriSymbol('١٢٣ه.')).toBe('١٢٣ هـ.');
            expect(standardizeHijriSymbol('123ه!')).toBe('123 هـ!');
        });

        it('should not replace ه when part of Arabic word', () => {
            expect(standardizeHijriSymbol('هذا')).toBe('هذا');
            expect(standardizeHijriSymbol('١٢٣هجري')).toBe('١٢٣هجري');
        });

        it('should handle multiple occurrences', () => {
            expect(standardizeHijriSymbol('١٢٣ه و٤٥٦ه')).toBe('١٢٣ هـ و٤٥٦ هـ');
        });

        it('should handle mixed English and Arabic digits', () => {
            expect(standardizeHijriSymbol('123ه و٤٥٦ ه')).toBe('123 هـ و٤٥٦ هـ');
        });
    });

    describe('standardizeAhHijriSymbol', () => {
        it('should replace standalone اه with اهـ', () => {
            expect(standardizeAhHijriSymbol('اه')).toBe('اهـ');
            expect(standardizeAhHijriSymbol('في اه')).toBe('في اهـ');
        });

        it('should replace اه at beginning of string', () => {
            expect(standardizeAhHijriSymbol('اه والبقية')).toBe('اهـ والبقية');
        });

        it('should replace اه at end of string', () => {
            expect(standardizeAhHijriSymbol('في السنة اه')).toBe('في السنة اهـ');
        });

        it('should replace اه surrounded by whitespace', () => {
            expect(standardizeAhHijriSymbol('قبل اه بعد')).toBe('قبل اهـ بعد');
        });

        it('should replace اه before non-Arabic characters', () => {
            expect(standardizeAhHijriSymbol('اه.')).toBe('اهـ.');
            expect(standardizeAhHijriSymbol('العام اه!')).toBe('العام اهـ!');
        });

        it('should replace اه after non-Arabic characters', () => {
            expect(standardizeAhHijriSymbol('.اه')).toBe('.اهـ');
            expect(standardizeAhHijriSymbol('(اه)')).toBe('(اهـ)');
        });

        it('should not replace اه when part of Arabic word', () => {
            expect(standardizeAhHijriSymbol('اهتمام')).toBe('اهتمام');
            expect(standardizeAhHijriSymbol('الاهتمام')).toBe('الاهتمام');
        });

        it('should handle multiple occurrences', () => {
            expect(standardizeAhHijriSymbol('اه اه')).toBe('اهـ اهـ');
        });
    });

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

        it('should handle string with bracket typos', () => {
            const input = '(« text »)';
            const result = preformatArabicText(input, true);

            expect(result).toContain('« text »');
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

    describe('parsePageRanges', () => {
        it('should parse single page number', () => {
            expect(parsePageRanges('5')).toEqual([5]);
        });

        it('should parse comma-separated page numbers', () => {
            expect(parsePageRanges('1,3,5,7')).toEqual([1, 3, 5, 7]);
        });

        it('should parse page range with dash', () => {
            expect(parsePageRanges('1-5')).toEqual([1, 2, 3, 4, 5]);
        });

        it('should parse single page range', () => {
            expect(parsePageRanges('10-12')).toEqual([10, 11, 12]);
        });

        it('should parse range with same start and end', () => {
            expect(parsePageRanges('7-7')).toEqual([7]);
        });

        it('should throw error when start page is greater than end page', () => {
            expect(() => parsePageRanges('10-5')).toThrow('Start page cannot be greater than end page');
        });

        it('should handle large ranges', () => {
            const result = parsePageRanges('98-100');
            expect(result).toEqual([98, 99, 100]);
            expect(result).toHaveLength(3);
        });

        it('should handle range starting from 1', () => {
            expect(parsePageRanges('1-3')).toEqual([1, 2, 3]);
        });

        it('should parse mixed comma input as individual pages', () => {
            expect(parsePageRanges('1,2,3')).toEqual([1, 2, 3]);
        });

        it('should handle string numbers correctly', () => {
            expect(parsePageRanges('001,002,003')).toEqual([1, 2, 3]);
        });

        it('should handle zero in ranges', () => {
            expect(parsePageRanges('0-2')).toEqual([0, 1, 2]);
        });
    });
});
