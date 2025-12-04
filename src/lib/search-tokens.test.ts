import { describe, expect, it } from 'bun:test';
import {
    containsTokens,
    expandTokens,
    getAvailableTokens,
    getTokenPattern,
    TOKEN_PATTERNS,
    templateToRegex,
} from './search-tokens';

describe('search-tokens', () => {
    describe('TOKEN_PATTERNS', () => {
        it('should have raqm pattern for single Arabic-Indic digit', () => {
            expect(TOKEN_PATTERNS.raqm).toBe('[\u0660-\u0669]');
        });

        it('should have raqms pattern for multiple Arabic-Indic digits', () => {
            expect(TOKEN_PATTERNS.raqms).toBe('[\u0660-\u0669]+');
        });

        it('should have harf pattern for single Arabic letter', () => {
            expect(TOKEN_PATTERNS.harf).toBe('[أ-ي]');
        });

        it('should have harfs pattern for multiple Arabic letters', () => {
            expect(TOKEN_PATTERNS.harfs).toBe('[أ-ي]+');
        });

        it('should have dash pattern for dash variants', () => {
            expect(TOKEN_PATTERNS.dash).toBe('[-–—ـ]');
        });
    });

    describe('containsTokens', () => {
        it('should return true for queries with tokens', () => {
            expect(containsTokens('{{raqm}}')).toBe(true);
            expect(containsTokens('، {{raqms}}')).toBe(true);
            expect(containsTokens('{{harf}}{{dash}}')).toBe(true);
        });

        it('should return false for queries without tokens', () => {
            expect(containsTokens('hello')).toBe(false);
            expect(containsTokens('/regex/')).toBe(false);
            expect(containsTokens('الحمد')).toBe(false);
        });

        it('should return false for incomplete token syntax', () => {
            expect(containsTokens('{raqm}')).toBe(false);
            expect(containsTokens('{{raqm}')).toBe(false);
            expect(containsTokens('{raqm}}')).toBe(false);
        });

        it('should return true for unknown tokens (syntax is valid)', () => {
            expect(containsTokens('{{unknown}}')).toBe(true);
        });
    });

    describe('expandTokens', () => {
        it('should expand raqm token', () => {
            expect(expandTokens('{{raqm}}')).toBe('[\u0660-\u0669]');
        });

        it('should expand raqms token', () => {
            expect(expandTokens('{{raqms}}')).toBe('[\u0660-\u0669]+');
        });

        it('should expand harf token', () => {
            expect(expandTokens('{{harf}}')).toBe('[أ-ي]');
        });

        it('should expand harfs token', () => {
            expect(expandTokens('{{harfs}}')).toBe('[أ-ي]+');
        });

        it('should expand dash token', () => {
            expect(expandTokens('{{dash}}')).toBe('[-–—ـ]');
        });

        it('should expand multiple tokens', () => {
            expect(expandTokens('{{dash}}{{raqm}}')).toBe('[-–—ـ][\u0660-\u0669]');
        });

        it('should preserve surrounding text', () => {
            expect(expandTokens('، {{raqms}}')).toBe('، [\u0660-\u0669]+');
        });

        it('should allow regex modifiers after tokens', () => {
            expect(expandTokens('{{raqm}}*')).toBe('[\u0660-\u0669]*');
            expect(expandTokens('{{raqm}}+')).toBe('[\u0660-\u0669]+');
            expect(expandTokens('{{raqm}}?')).toBe('[\u0660-\u0669]?');
        });

        it('should leave unknown tokens as-is', () => {
            expect(expandTokens('{{unknown}}')).toBe('{{unknown}}');
        });

        it('should handle mixed known and unknown tokens', () => {
            expect(expandTokens('{{raqm}}{{unknown}}')).toBe('[\u0660-\u0669]{{unknown}}');
        });

        it('should handle empty string', () => {
            expect(expandTokens('')).toBe('');
        });

        it('should handle string with no tokens', () => {
            expect(expandTokens('hello world')).toBe('hello world');
        });
    });

    describe('templateToRegex', () => {
        it('should create regex from template with raqms', () => {
            const regex = templateToRegex('، {{raqms}}');
            expect(regex).not.toBeNull();
            expect(regex?.test('، ١٢٣')).toBe(true);
            expect(regex?.test('، abc')).toBe(false);
        });

        it('should create regex from template with single raqm', () => {
            const regex = templateToRegex('{{raqm}}');
            expect(regex).not.toBeNull();
            expect(regex?.test('١')).toBe(true);
            expect(regex?.test('٩')).toBe(true);
            expect(regex?.test('1')).toBe(false);
        });

        it('should create regex from template with harf', () => {
            const regex = templateToRegex('{{harf}}');
            expect(regex).not.toBeNull();
            expect(regex?.test('ا')).toBe(true);
            expect(regex?.test('ي')).toBe(true);
        });

        it('should create regex from template with dash', () => {
            const regex = templateToRegex('{{dash}}');
            expect(regex).not.toBeNull();
            expect(regex?.test('-')).toBe(true);
            expect(regex?.test('–')).toBe(true);
            expect(regex?.test('—')).toBe(true);
            expect(regex?.test('ـ')).toBe(true);
        });

        it('should support regex modifiers after tokens', () => {
            const regex = templateToRegex('{{raqm}}*');
            expect(regex).not.toBeNull();
            expect(regex?.test('')).toBe(true); // zero occurrences
            expect(regex?.test('١')).toBe(true);
            expect(regex?.test('١٢٣')).toBe(true);
        });

        it('should handle complex patterns', () => {
            const regex = templateToRegex('^{{raqms}}\\s?{{dash}}');
            expect(regex).not.toBeNull();
            expect(regex?.test('١٢٣-')).toBe(true);
            expect(regex?.test('١ –')).toBe(true);
        });

        it('should return null for invalid resulting regex', () => {
            // Unknown token creates invalid regex
            const regex = templateToRegex('{{unknown}}');
            expect(regex).toBeNull();
        });

        it('should return valid regex for pattern with no tokens', () => {
            const regex = templateToRegex('hello');
            expect(regex).not.toBeNull();
            expect(regex?.test('hello world')).toBe(true);
        });
    });

    describe('getAvailableTokens', () => {
        it('should return all token names', () => {
            const tokens = getAvailableTokens();
            expect(tokens).toContain('raqm');
            expect(tokens).toContain('raqms');
            expect(tokens).toContain('harf');
            expect(tokens).toContain('harfs');
            expect(tokens).toContain('dash');
        });

        it('should return correct number of tokens', () => {
            const tokens = getAvailableTokens();
            expect(tokens.length).toBe(Object.keys(TOKEN_PATTERNS).length);
        });
    });

    describe('getTokenPattern', () => {
        it('should return pattern for known tokens', () => {
            expect(getTokenPattern('raqm')).toBe('[\u0660-\u0669]');
            expect(getTokenPattern('raqms')).toBe('[\u0660-\u0669]+');
            expect(getTokenPattern('harf')).toBe('[أ-ي]');
            expect(getTokenPattern('harfs')).toBe('[أ-ي]+');
            expect(getTokenPattern('dash')).toBe('[-–—ـ]');
        });

        it('should return undefined for unknown tokens', () => {
            expect(getTokenPattern('unknown')).toBeUndefined();
            expect(getTokenPattern('')).toBeUndefined();
        });
    });
});
