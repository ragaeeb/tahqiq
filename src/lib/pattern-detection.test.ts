import { describe, expect, it } from 'bun:test';
import {
    analyzeTextForRule,
    detectTokenPatterns,
    generateTemplateFromText,
    suggestPatternConfig,
} from './pattern-detection';

describe('pattern-detection', () => {
    describe('detectTokenPatterns', () => {
        it('should return empty array for empty input', () => {
            expect(detectTokenPatterns('')).toEqual([]);
        });

        it('should detect Arabic-Indic digits as raqms', () => {
            const result = detectTokenPatterns('٣٤');
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({ index: 0, match: '٣٤', token: 'raqms' });
        });

        it('should detect single Arabic-Indic digit', () => {
            const result = detectTokenPatterns('٣');
            expect(result).toHaveLength(1);
            expect(result[0].match).toBe('٣');
            expect(['raqm', 'raqms']).toContain(result[0].token);
        });

        it('should detect dash character', () => {
            const result = detectTokenPatterns(' - ');
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({ match: '-', token: 'dash' });
        });

        it('should detect numbered pattern with digits and dash', () => {
            const result = detectTokenPatterns('٣٤ - ');
            // May detect as single 'numbered' composite token or separate tokens
            expect(result.length).toBeGreaterThanOrEqual(1);

            const tokens = result.map((r) => r.token);
            // Either 'numbered' (composite) or 'raqms' should be detected
            expect(tokens.some((t) => t === 'numbered' || t === 'raqms')).toBe(true);
        });

        it('should detect basmalah', () => {
            const result = detectTokenPatterns('بسم الله الرحمن الرحيم');
            // Basmalah should be detected among the patterns
            expect(result.length).toBeGreaterThanOrEqual(1);
            expect(result.some((r) => r.token === 'basmalah')).toBe(true);
        });

        it('should detect bab (chapter)', () => {
            const result = detectTokenPatterns('باب ما جاء في');
            expect(result.length).toBeGreaterThanOrEqual(1);
            const hasStructural = result.some((r) => ['bab', 'fasl', 'kitab'].includes(r.token));
            expect(hasStructural).toBe(true);
        });

        it('should not overlap detected patterns', () => {
            const result = detectTokenPatterns('٣٤ - حدثنا');
            // Each position should only be covered by one pattern
            const coveredPositions = new Set<number>();
            for (const pattern of result) {
                for (let i = pattern.index; i < pattern.endIndex; i++) {
                    expect(coveredPositions.has(i)).toBe(false);
                    coveredPositions.add(i);
                }
            }
        });

        it('should sort results by position', () => {
            const result = detectTokenPatterns('٣٤ - باب');
            for (let i = 1; i < result.length; i++) {
                expect(result[i].index).toBeGreaterThanOrEqual(result[i - 1].index);
            }
        });
    });

    describe('generateTemplateFromText', () => {
        it('should return original text when no patterns detected', () => {
            expect(generateTemplateFromText('hello', [])).toBe('hello');
        });

        it('should return original text for empty input', () => {
            expect(generateTemplateFromText('', [])).toBe('');
        });

        it('should replace detected patterns with tokens', () => {
            const detected = detectTokenPatterns('٣٤');
            const template = generateTemplateFromText('٣٤', detected);
            expect(template).toBe('{{raqms}}');
        });

        it('should preserve non-matched text', () => {
            const text = '٣٤ - حدثنا';
            const detected = detectTokenPatterns(text);
            const template = generateTemplateFromText(text, detected);
            // Should have tokens - could be {{numbered}} (composite) or {{raqms}} + {{dash}}
            expect(template).toMatch(/\{\{(numbered|raqms)\}\}/);
        });
    });

    describe('suggestPatternConfig', () => {
        it('should suggest lineStartsWith with fuzzy for structural tokens', () => {
            const detected = detectTokenPatterns('باب');
            const config = suggestPatternConfig(detected);
            expect(config.patternType).toBe('lineStartsWith');
            expect(config.fuzzy).toBe(true);
        });

        it('should suggest lineStartsAfter for numbered patterns', () => {
            const detected = detectTokenPatterns('٣٤ - ');
            const config = suggestPatternConfig(detected);
            expect(config.patternType).toBe('lineStartsAfter');
            expect(config.fuzzy).toBe(false);
        });

        it('should suggest hadith metaType for numbered patterns', () => {
            const detected = detectTokenPatterns('٣٤ - ');
            const config = suggestPatternConfig(detected);
            expect(config.metaType).toBe('hadith');
        });

        it('should suggest chapter metaType for bab', () => {
            const detected = detectTokenPatterns('باب');
            const config = suggestPatternConfig(detected);
            expect(['bab', 'chapter']).toContain(config.metaType);
        });

        it('should default to lineStartsAfter without fuzzy for unknown patterns', () => {
            const config = suggestPatternConfig([]);
            expect(config.patternType).toBe('lineStartsAfter');
            expect(config.fuzzy).toBe(false);
        });
    });

    describe('analyzeTextForRule', () => {
        it('should return null for text with no detectable patterns', () => {
            // Simple Latin text unlikely to match Arabic patterns
            const result = analyzeTextForRule('hello world');
            expect(result).toBeNull();
        });

        it('should return complete rule config for numbered pattern', () => {
            const result = analyzeTextForRule('٣٤ - ');
            expect(result).not.toBeNull();
            // Could be {{numbered}} (composite) or {{raqms}} + {{dash}}
            expect(result?.template).toMatch(/\{\{(numbered|raqms)\}\}/);
            expect(result?.patternType).toBe('lineStartsAfter');
            expect(result?.detected.length).toBeGreaterThan(0);
        });

        it('should return complete rule config for basmalah', () => {
            const result = analyzeTextForRule('بسم الله الرحمن الرحيم');
            expect(result).not.toBeNull();
            expect(result?.template).toContain('{{basmalah}}');
            expect(result?.patternType).toBe('lineStartsWith');
            expect(result?.fuzzy).toBe(true);
        });

        it('should return detected patterns array', () => {
            const result = analyzeTextForRule('٣٤ - ');
            expect(result?.detected).toBeInstanceOf(Array);
            expect(result?.detected.length).toBeGreaterThan(0);
        });
    });
});
