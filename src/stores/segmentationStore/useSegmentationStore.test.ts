import { beforeEach, describe, expect, it } from 'bun:test';
import { useSegmentationStore } from './useSegmentationStore';

const resetStore = () => {
    useSegmentationStore.setState({
        allLineStarts: [],
        ruleConfigs: [],
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

    describe('setAllLineStarts', () => {
        it('should set patterns and clear ruleConfigs', () => {
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
            });

            useSegmentationStore.getState().setAllLineStarts([
                { count: 5, examples: [], pattern: 'new1' },
                { count: 3, examples: [], pattern: 'new2' },
            ]);

            const state = useSegmentationStore.getState();
            expect(state.allLineStarts).toHaveLength(2);
            expect(state.allLineStarts[0]).toEqual({ count: 5, examples: [], pattern: 'new1' });
            expect(state.ruleConfigs).toHaveLength(0);
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

    describe('reset', () => {
        it('should reset store to initial state', () => {
            useSegmentationStore.setState({
                allLineStarts: [{ count: 1, examples: [], pattern: 'test' }],
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
            });

            useSegmentationStore.getState().reset();

            const state = useSegmentationStore.getState();
            expect(state.allLineStarts).toHaveLength(0);
            expect(state.ruleConfigs).toHaveLength(0);
        });
    });
});
