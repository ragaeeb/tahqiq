import { describe, expect, it } from 'bun:test';
import { createMatcher, detectStrategy, isRegexPattern, parseRegex } from './search';

describe('search utilities', () => {
    describe('isRegexPattern', () => {
        it('should detect regex patterns', () => {
            expect(isRegexPattern('/test/')).toBe(true);
            expect(isRegexPattern('/^\\d+ /g')).toBe(true);
            expect(isRegexPattern('/pattern/gimu')).toBe(true);
        });

        it('should reject non-regex strings', () => {
            expect(isRegexPattern('test')).toBe(false);
            expect(isRegexPattern('/incomplete')).toBe(false);
            expect(isRegexPattern('hello world')).toBe(false);
        });
    });

    describe('parseRegex', () => {
        it('should parse valid regex patterns', () => {
            const regex = parseRegex('/test/');
            expect(regex).not.toBeNull();
            expect(regex?.test('test')).toBe(true);
        });

        it('should include unicode flag by default', () => {
            const regex = parseRegex('/test/g');
            expect(regex?.flags).toContain('u');
        });

        it('should handle Unicode patterns for Arabic numerals', () => {
            const regex = parseRegex('/^[\u0660-\u0669]+/');
            expect(regex).not.toBeNull();
            expect(regex?.test('١٢٣')).toBe(true);
            expect(regex?.test('abc')).toBe(false);
        });

        it('should return null for invalid regex', () => {
            expect(parseRegex('/[invalid/')).toBeNull();
            expect(parseRegex('not a regex')).toBeNull();
        });
    });

    describe('detectStrategy', () => {
        it('should detect regex strategy', () => {
            expect(detectStrategy('/pattern/')).toBe('regex');
            expect(detectStrategy('/^\\d+/g')).toBe('regex');
        });

        it('should detect template strategy', () => {
            expect(detectStrategy('{{raqm}}')).toBe('template');
            expect(detectStrategy('، {{raqms}}')).toBe('template');
        });

        it('should default to literal strategy', () => {
            expect(detectStrategy('hello')).toBe('literal');
            expect(detectStrategy('الحمد')).toBe('literal');
        });
    });

    describe('createMatcher', () => {
        describe('literal matching', () => {
            it('should match text containing query', () => {
                const matches = createMatcher('hello');
                expect(matches('hello world')).toBe(true);
                expect(matches('say hello')).toBe(true);
                expect(matches('goodbye')).toBe(false);
            });

            it('should match Arabic text', () => {
                const matches = createMatcher('الحمد');
                expect(matches('الحمد لله')).toBe(true);
                expect(matches('بسم الله')).toBe(false);
            });

            it('should handle null/undefined text', () => {
                const matches = createMatcher('test');
                expect(matches(null)).toBe(false);
                expect(matches(undefined)).toBe(false);
            });
        });

        describe('regex matching', () => {
            it('should match with regex patterns', () => {
                const matches = createMatcher('/^\\d+ /');
                expect(matches('123 text')).toBe(true);
                expect(matches('text 123')).toBe(false);
            });

            it('should match Arabic numbers at start', () => {
                const matches = createMatcher('/^[\u0660-\u0669]+/');
                expect(matches('١٢٣ نص')).toBe(true);
                expect(matches('نص ١٢٣')).toBe(false);
            });

            it('should match Arabic number followed by dash', () => {
                const matches = createMatcher('/^[\u0660-\u0669]+\\s?[-–—ـ].*/');
                expect(matches('١- نص')).toBe(true);
                expect(matches('١٢– نص')).toBe(true);
                expect(matches('نص')).toBe(false);
            });

            it('should fallback to literal on invalid regex', () => {
                const matches = createMatcher('/[invalid/');
                // Falls back to literal includes which looks for "/[invalid/"
                expect(matches('/[invalid/')).toBe(true);
                expect(matches('hello')).toBe(false);
            });

            it('should handle null/undefined text', () => {
                const matches = createMatcher('/test/');
                expect(matches(null)).toBe(false);
                expect(matches(undefined)).toBe(false);
            });
        });

        describe('template matching', () => {
            it('should match Arabic digits with raqm token', () => {
                const matches = createMatcher('{{raqm}}');
                expect(matches('١')).toBe(true);
                expect(matches('٩')).toBe(true);
                expect(matches('1')).toBe(false);
            });

            it('should match multiple Arabic digits with raqms token', () => {
                const matches = createMatcher('{{raqms}}');
                expect(matches('١٢٣')).toBe(true);
                expect(matches('١')).toBe(true);
            });

            it('should match Arabic comma followed by digits', () => {
                const matches = createMatcher('، {{raqms}}');
                expect(matches('، ١٢٣')).toBe(true);
                expect(matches('، abc')).toBe(false);
            });

            it('should match Arabic letters with harf token', () => {
                const matches = createMatcher('{{harf}}');
                expect(matches('ا')).toBe(true);
                expect(matches('ب')).toBe(true);
                expect(matches('ي')).toBe(true);
            });

            it('should match dash variants with dash token', () => {
                const matches = createMatcher('{{dash}}');
                expect(matches('-')).toBe(true);
                expect(matches('–')).toBe(true);
                expect(matches('—')).toBe(true);
                expect(matches('ـ')).toBe(true);
            });

            it('should support regex modifiers after tokens', () => {
                const matches = createMatcher('{{raqm}}+');
                expect(matches('١')).toBe(true);
                expect(matches('١٢٣')).toBe(true);
            });

            it('should match complex patterns with multiple tokens', () => {
                const matches = createMatcher('{{raqms}}{{dash}}');
                expect(matches('١٢٣-')).toBe(true);
                expect(matches('١–')).toBe(true);
            });

            it('should fallback to literal for templates with unknown tokens', () => {
                const matches = createMatcher('{{unknown}}');
                // Falls back to literal - looks for "{{unknown}}"
                expect(matches('{{unknown}}')).toBe(true);
                expect(matches('hello')).toBe(false);
            });

            it('should handle null/undefined text', () => {
                const matches = createMatcher('{{raqm}}');
                expect(matches(null)).toBe(false);
                expect(matches(undefined)).toBe(false);
            });
        });
    });
});
