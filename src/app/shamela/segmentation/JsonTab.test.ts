import { describe, expect, it } from 'bun:test';
import type { Replacement, RuleConfig, TokenMapping } from '@/stores/segmentationStore/types';
import { buildGeneratedOptions } from './JsonTab';

// Replicate applyTokenMappings for direct testing
const applyTokenMappings = (template: string, mappings: TokenMapping[]): string => {
    let result = template;
    for (const { token, name } of mappings) {
        const regex = new RegExp(`\\{\\{${token}\\}\\}`, 'g');
        result = result.replace(regex, `{{${token}:${name}}}`);
    }
    return result;
};

describe('JsonTab', () => {
    describe('applyTokenMappings', () => {
        it('should transform token to token:name format', () => {
            const result = applyTokenMappings('{{raqms}} text', [{ name: 'num', token: 'raqms' }]);

            expect(result).toBe('{{raqms:num}} text');
        });

        it('should handle multiple tokens', () => {
            const result = applyTokenMappings('{{raqms}} and {{rumuz}}', [
                { name: 'num', token: 'raqms' },
                { name: 'symbol', token: 'rumuz' },
            ]);

            expect(result).toBe('{{raqms:num}} and {{rumuz:symbol}}');
        });

        it('should leave tokens with existing names unchanged', () => {
            const result = applyTokenMappings('{{raqms:hadith}} text', [{ name: 'num', token: 'raqms' }]);

            expect(result).toBe('{{raqms:hadith}} text');
        });

        it('should handle templates without matching tokens', () => {
            const result = applyTokenMappings('no tokens here', [{ name: 'num', token: 'raqms' }]);

            expect(result).toBe('no tokens here');
        });

        it('should handle multiple occurrences of same token', () => {
            const result = applyTokenMappings('{{raqms}} and {{raqms}} again', [{ name: 'num', token: 'raqms' }]);

            expect(result).toBe('{{raqms:num}} and {{raqms:num}} again');
        });
    });

    describe('buildGeneratedOptions', () => {
        it('should build options with empty rules', () => {
            const result = JSON.parse(buildGeneratedOptions([], false));

            expect(result.maxPages).toBe(1);
            expect(result.rules).toEqual([]);
            expect(result.breakpoints).toBeUndefined();
        });

        it('should include breakpoints when sliceAtPunctuation is true', () => {
            const result = JSON.parse(buildGeneratedOptions([], true));

            expect(result.breakpoints).toEqual([{ pattern: '{{tarqim}}\\s*' }, '']);
        });

        it('should build options with rule configs', () => {
            const rules: RuleConfig[] = [
                {
                    fuzzy: true,
                    metaType: 'book',
                    pageStartGuard: false,
                    pattern: '{{kitab}}',
                    patternType: 'lineStartsWith',
                    template: '{{kitab}} ',
                },
            ];

            const result = JSON.parse(buildGeneratedOptions(rules, false));

            expect(result.rules).toHaveLength(1);
            expect(result.rules[0].lineStartsWith).toEqual(['{{kitab}} ']);
            expect(result.rules[0].fuzzy).toBe(true);
            expect(result.rules[0].meta).toEqual({ type: 'book' });
        });

        it('should not include fuzzy when false', () => {
            const rules: RuleConfig[] = [
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'test',
                    patternType: 'lineStartsAfter',
                    template: 'test',
                },
            ];

            const result = JSON.parse(buildGeneratedOptions(rules, false));

            expect(result.rules[0].fuzzy).toBeUndefined();
            expect(result.rules[0].meta).toBeUndefined();
        });

        it('should include pageStartGuard when enabled', () => {
            const rules: RuleConfig[] = [
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: true,
                    pattern: 'test',
                    patternType: 'lineStartsAfter',
                    template: 'test',
                },
            ];

            const result = JSON.parse(buildGeneratedOptions(rules, false));

            expect(result.rules[0].pageStartGuard).toBe('{{tarqim}}');
        });

        it('should apply token mappings to templates', () => {
            const rules: RuleConfig[] = [
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: '{{raqms}}',
                    patternType: 'lineStartsAfter',
                    template: '{{raqms}} text',
                },
            ];
            const mappings: TokenMapping[] = [{ name: 'num', token: 'raqms' }];

            const result = JSON.parse(buildGeneratedOptions(rules, false, mappings));

            expect(result.rules[0].lineStartsAfter).toEqual(['{{raqms:num}} text']);
        });

        it('should handle array templates', () => {
            const rules: RuleConfig[] = [
                {
                    fuzzy: false,
                    metaType: 'chapter',
                    pageStartGuard: false,
                    pattern: 'multi',
                    patternType: 'lineStartsWith',
                    template: ['Template A', 'Template B'],
                },
            ];

            const result = JSON.parse(buildGeneratedOptions(rules, false));

            expect(result.rules[0].lineStartsWith).toEqual(['Template A', 'Template B']);
        });

        it('should include min value when specified', () => {
            const rules: RuleConfig[] = [
                {
                    fuzzy: false,
                    metaType: 'none',
                    min: 5,
                    pageStartGuard: false,
                    pattern: 'test',
                    patternType: 'lineStartsAfter',
                    template: 'test',
                },
            ];

            const result = JSON.parse(buildGeneratedOptions(rules, false));

            expect(result.rules[0].min).toBe(5);
        });

        it('should include non-empty replacements', () => {
            const replacements: Replacement[] = [
                { regex: 'foo', replacement: 'bar' },
                { regex: '', replacement: 'empty' },
                { regex: 'baz', replacement: '' },
            ];

            const result = JSON.parse(buildGeneratedOptions([], false, [], replacements));

            expect(result.replace).toHaveLength(2);
            expect(result.replace[0]).toEqual({ regex: 'foo', replacement: 'bar' });
            expect(result.replace[1]).toEqual({ regex: 'baz', replacement: '' });
        });

        it('should not include replace when all replacements are empty', () => {
            const replacements: Replacement[] = [{ regex: '', replacement: '' }];

            const result = JSON.parse(buildGeneratedOptions([], false, [], replacements));

            expect(result.replace).toBeUndefined();
        });
    });
});
