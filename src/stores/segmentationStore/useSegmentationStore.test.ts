import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { CommonPattern, RuleConfig } from './types';
import { useSegmentationStore } from './useSegmentationStore';

const resetStore = () => {
    useSegmentationStore.setState({
        allLineStarts: [],
        replacements: [],
        ruleConfigs: [],
        selectedPatterns: new Set<string>(),
        sliceAtPunctuation: true,
        tokenMappings: [
            { name: 'num', token: 'raqms' },
            { name: 'rumuz', token: 'rumuz' },
        ],
    });
};

describe('useSegmentationStore', () => {
    beforeEach(() => {
        resetStore();
    });

    afterEach(() => {
        resetStore();
    });

    describe('togglePattern', () => {
        it('should add pattern to selectedPatterns and create ruleConfig when toggling on', () => {
            useSegmentationStore.getState().togglePattern('{{basmalah}}');

            const state = useSegmentationStore.getState();
            expect(state.selectedPatterns.has('{{basmalah}}')).toBe(true);
            expect(state.ruleConfigs).toHaveLength(1);
            expect(state.ruleConfigs[0]).toEqual({
                fuzzy: false,
                metaType: 'none',
                pageStartGuard: false,
                pattern: '{{basmalah}}',
                patternType: 'lineStartsAfter',
                template: '{{basmalah}}',
            });
        });

        it('should set fuzzy and metaType based on pattern content for kitab', () => {
            useSegmentationStore.getState().togglePattern('{{kitab}} test');

            const state = useSegmentationStore.getState();
            expect(state.ruleConfigs[0]?.fuzzy).toBe(true);
            expect(state.ruleConfigs[0]?.metaType).toBe('book');
        });

        it('should set metaType to chapter for bab patterns', () => {
            useSegmentationStore.getState().togglePattern('{{bab}} test');

            expect(useSegmentationStore.getState().ruleConfigs[0]?.metaType).toBe('chapter');
        });

        it('should set metaType to chapter for fasl patterns', () => {
            useSegmentationStore.getState().togglePattern('{{fasl}} test');

            expect(useSegmentationStore.getState().ruleConfigs[0]?.metaType).toBe('chapter');
        });

        it('should remove pattern from selectedPatterns and ruleConfigs when toggling off', () => {
            const pattern = '{{test}}';
            useSegmentationStore.setState({
                ruleConfigs: [
                    {
                        fuzzy: false,
                        metaType: 'none',
                        pageStartGuard: false,
                        pattern,
                        patternType: 'lineStartsAfter',
                        template: pattern,
                    },
                ],
                selectedPatterns: new Set([pattern]),
            });

            useSegmentationStore.getState().togglePattern(pattern);

            const state = useSegmentationStore.getState();
            expect(state.selectedPatterns.has(pattern)).toBe(false);
            expect(state.ruleConfigs).toHaveLength(0);
        });
    });

    describe('addCommonPattern', () => {
        it('should add common pattern to selectedPatterns and ruleConfigs', () => {
            const common: CommonPattern = {
                fuzzy: true,
                label: 'Kitab',
                metaType: 'book',
                pattern: '{{kitab}} ',
                patternType: 'lineStartsWith',
            };

            useSegmentationStore.getState().addCommonPattern(common);

            const state = useSegmentationStore.getState();
            expect(state.selectedPatterns.has('{{kitab}} ')).toBe(true);
            expect(state.ruleConfigs).toHaveLength(1);
            expect(state.ruleConfigs[0]).toEqual({
                fuzzy: true,
                metaType: 'book',
                pageStartGuard: false,
                pattern: '{{kitab}} ',
                patternType: 'lineStartsWith',
                template: '{{kitab}} ',
            });
        });

        it('should not add duplicate pattern', () => {
            const common: CommonPattern = {
                fuzzy: true,
                label: 'Kitab',
                metaType: 'book',
                pattern: '{{kitab}}',
                patternType: 'lineStartsWith',
            };

            useSegmentationStore.setState({ selectedPatterns: new Set(['{{kitab}}']) });

            useSegmentationStore.getState().addCommonPattern(common);

            expect(useSegmentationStore.getState().ruleConfigs).toHaveLength(0);
        });
    });

    describe('updateRuleConfig', () => {
        it('should update ruleConfig at specified index', () => {
            useSegmentationStore.setState({
                ruleConfigs: [
                    {
                        fuzzy: false,
                        metaType: 'none',
                        pageStartGuard: false,
                        pattern: 'test',
                        patternType: 'lineStartsAfter',
                        template: 'test',
                    },
                ],
            });

            useSegmentationStore.getState().updateRuleConfig(0, { fuzzy: true, metaType: 'chapter' });

            const config = useSegmentationStore.getState().ruleConfigs[0];
            expect(config?.fuzzy).toBe(true);
            expect(config?.metaType).toBe('chapter');
            expect(config?.pattern).toBe('test');
        });

        it('should not update if index is out of bounds', () => {
            useSegmentationStore.setState({
                ruleConfigs: [
                    {
                        fuzzy: false,
                        metaType: 'none',
                        pageStartGuard: false,
                        pattern: 'test',
                        patternType: 'lineStartsAfter',
                        template: 'test',
                    },
                ],
            });

            useSegmentationStore.getState().updateRuleConfig(5, { fuzzy: true });

            expect(useSegmentationStore.getState().ruleConfigs[0]?.fuzzy).toBe(false);
        });
    });

    describe('moveRule', () => {
        it('should move rule from one index to another', () => {
            const rules: RuleConfig[] = [
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'A',
                    patternType: 'lineStartsAfter',
                    template: 'A',
                },
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'B',
                    patternType: 'lineStartsAfter',
                    template: 'B',
                },
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'C',
                    patternType: 'lineStartsAfter',
                    template: 'C',
                },
            ];
            useSegmentationStore.setState({ ruleConfigs: rules });

            useSegmentationStore.getState().moveRule(0, 2);

            const configs = useSegmentationStore.getState().ruleConfigs;
            expect(configs[0]?.pattern).toBe('B');
            expect(configs[1]?.pattern).toBe('C');
            expect(configs[2]?.pattern).toBe('A');
        });

        it('should not move if indices are out of bounds', () => {
            const rules: RuleConfig[] = [
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'A',
                    patternType: 'lineStartsAfter',
                    template: 'A',
                },
            ];
            useSegmentationStore.setState({ ruleConfigs: rules });

            useSegmentationStore.getState().moveRule(0, 5);

            expect(useSegmentationStore.getState().ruleConfigs[0]?.pattern).toBe('A');
        });
    });

    describe('sortRulesByLength', () => {
        it('should sort rules by template length descending', () => {
            const rules: RuleConfig[] = [
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'A',
                    patternType: 'lineStartsAfter',
                    template: 'short',
                },
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'B',
                    patternType: 'lineStartsAfter',
                    template: 'very long template',
                },
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'C',
                    patternType: 'lineStartsAfter',
                    template: 'medium len',
                },
            ];
            useSegmentationStore.setState({ ruleConfigs: rules });

            useSegmentationStore.getState().sortRulesByLength();

            const configs = useSegmentationStore.getState().ruleConfigs;
            expect(configs[0]?.pattern).toBe('B');
            expect(configs[1]?.pattern).toBe('C');
            expect(configs[2]?.pattern).toBe('A');
        });

        it('should sort template arrays within rules and then sort rules by longest template', () => {
            const rules: RuleConfig[] = [
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'A',
                    patternType: 'lineStartsAfter',
                    template: ['short', 'very long array element'],
                },
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'B',
                    patternType: 'lineStartsAfter',
                    template: 'medium length',
                },
            ];
            useSegmentationStore.setState({ ruleConfigs: rules });

            useSegmentationStore.getState().sortRulesByLength();

            const configs = useSegmentationStore.getState().ruleConfigs;
            // Rule A's template array gets sorted first: ['very long array element', 'short']
            // Then rules are sorted by first template length: A (24 chars) > B (13 chars)
            expect(configs[0]?.pattern).toBe('A');
            expect(configs[0]?.template).toEqual(['very long array element', 'short']);
            expect(configs[1]?.pattern).toBe('B');
        });
    });

    describe('mergeSelectedRules', () => {
        it('should merge rules with same patternType into single rule with array template', () => {
            const rules: RuleConfig[] = [
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'A',
                    patternType: 'lineStartsAfter',
                    template: 'Template A',
                },
                {
                    fuzzy: true,
                    metaType: 'chapter',
                    pageStartGuard: false,
                    pattern: 'B',
                    patternType: 'lineStartsAfter',
                    template: 'Template B',
                },
            ];
            useSegmentationStore.setState({ ruleConfigs: rules, selectedPatterns: new Set(['A', 'B']) });

            useSegmentationStore.getState().mergeSelectedRules(['A', 'B']);

            const state = useSegmentationStore.getState();
            expect(state.ruleConfigs).toHaveLength(1);
            expect(state.ruleConfigs[0]?.template).toEqual(['Template A', 'Template B']);
            expect(state.ruleConfigs[0]?.fuzzy).toBe(true);
            expect(state.ruleConfigs[0]?.metaType).toBe('chapter');
        });

        it('should not merge rules with different patternTypes', () => {
            const rules: RuleConfig[] = [
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'A',
                    patternType: 'lineStartsAfter',
                    template: 'A',
                },
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'B',
                    patternType: 'lineStartsWith',
                    template: 'B',
                },
            ];
            useSegmentationStore.setState({ ruleConfigs: rules });

            useSegmentationStore.getState().mergeSelectedRules(['A', 'B']);

            expect(useSegmentationStore.getState().ruleConfigs).toHaveLength(2);
        });

        it('should not merge if less than 2 patterns selected', () => {
            const rules: RuleConfig[] = [
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'A',
                    patternType: 'lineStartsAfter',
                    template: 'A',
                },
            ];
            useSegmentationStore.setState({ ruleConfigs: rules });

            useSegmentationStore.getState().mergeSelectedRules(['A']);

            expect(useSegmentationStore.getState().ruleConfigs).toHaveLength(1);
        });

        it('should insert merged rule at correct position when rules are not adjacent', () => {
            const rules: RuleConfig[] = [
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'X',
                    patternType: 'lineStartsAfter',
                    template: 'X',
                },
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'A',
                    patternType: 'lineStartsAfter',
                    template: 'A',
                },
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'Y',
                    patternType: 'lineStartsAfter',
                    template: 'Y',
                },
                {
                    fuzzy: false,
                    metaType: 'none',
                    pageStartGuard: false,
                    pattern: 'B',
                    patternType: 'lineStartsAfter',
                    template: 'B',
                },
            ];
            useSegmentationStore.setState({ ruleConfigs: rules, selectedPatterns: new Set(['A', 'B']) });

            useSegmentationStore.getState().mergeSelectedRules(['A', 'B']);

            const configs = useSegmentationStore.getState().ruleConfigs;
            expect(configs).toHaveLength(3);
            expect(configs[0]?.pattern).toBe('X');
            expect(configs[1]?.pattern).toBe('A');
            expect(configs[1]?.template).toEqual(['A', 'B']);
            expect(configs[2]?.pattern).toBe('Y');
        });
    });

    describe('setAllLineStarts', () => {
        it('should set patterns and clear ruleConfigs and selectedPatterns', () => {
            useSegmentationStore.setState({
                ruleConfigs: [
                    {
                        fuzzy: false,
                        metaType: 'none',
                        pageStartGuard: false,
                        pattern: 'old',
                        patternType: 'lineStartsAfter',
                        template: 'old',
                    },
                ],
                selectedPatterns: new Set(['old']),
            });

            useSegmentationStore.getState().setAllLineStarts([
                { count: 5, pattern: 'new1' },
                { count: 3, pattern: 'new2' },
            ]);

            const state = useSegmentationStore.getState();
            expect(state.allLineStarts).toHaveLength(2);
            expect(state.allLineStarts[0]).toEqual({ count: 5, pattern: 'new1' });
            expect(state.ruleConfigs).toHaveLength(0);
            expect(state.selectedPatterns.size).toBe(0);
        });
    });

    describe('setReplacements', () => {
        it('should set replacements array', () => {
            useSegmentationStore.getState().setReplacements([
                { regex: 'foo', replacement: 'bar' },
                { regex: 'baz', replacement: 'qux' },
            ]);

            const replacements = useSegmentationStore.getState().replacements;
            expect(replacements).toHaveLength(2);
            expect(replacements[0]).toEqual({ regex: 'foo', replacement: 'bar' });
            expect(replacements[1]).toEqual({ regex: 'baz', replacement: 'qux' });
        });
    });

    describe('setTokenMappings', () => {
        it('should set token mappings array', () => {
            useSegmentationStore.getState().setTokenMappings([{ name: 'custom', token: 'mytoken' }]);

            const mappings = useSegmentationStore.getState().tokenMappings;
            expect(mappings).toHaveLength(1);
            expect(mappings[0]).toEqual({ name: 'custom', token: 'mytoken' });
        });
    });

    describe('setSliceAtPunctuation', () => {
        it('should toggle sliceAtPunctuation flag', () => {
            expect(useSegmentationStore.getState().sliceAtPunctuation).toBe(true);

            useSegmentationStore.getState().setSliceAtPunctuation(false);

            expect(useSegmentationStore.getState().sliceAtPunctuation).toBe(false);
        });
    });

    describe('reset', () => {
        it('should reset store to initial state', () => {
            useSegmentationStore.setState({
                allLineStarts: [{ count: 1, pattern: 'test' }],
                replacements: [{ regex: 'a', replacement: 'b' }],
                ruleConfigs: [
                    {
                        fuzzy: true,
                        metaType: 'book',
                        pageStartGuard: true,
                        pattern: 'x',
                        patternType: 'lineStartsWith',
                        template: 'x',
                    },
                ],
                selectedPatterns: new Set(['x']),
                sliceAtPunctuation: false,
            });

            useSegmentationStore.getState().reset();

            const state = useSegmentationStore.getState();
            expect(state.allLineStarts).toHaveLength(0);
            expect(state.ruleConfigs).toHaveLength(0);
            expect(state.selectedPatterns.size).toBe(0);
            expect(state.replacements).toHaveLength(0);
            expect(state.sliceAtPunctuation).toBe(true);
        });
    });
});
