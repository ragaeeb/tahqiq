import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { mergeWithBelow } from './actions';

describe('actions', () => {
    describe('mergeWithBelow', () => {
        it('should merge the row with the one below it', () => {
            const state = {
                sheets: [
                    {
                        alt: [
                            { id: 12, text: 'A' },
                            { id: 13, text: 'B' },
                        ],
                        observations: [
                            { id: 2, text: 'A' },
                            { id: 3, text: 'B' },
                        ],
                        page: 1,
                    },
                ],
            } as any;

            mergeWithBelow(state, 1, 2);

            expect(state).toEqual({
                sheets: [
                    {
                        alt: [{ id: 12, lastUpdate: expect.any(Number), text: 'B A' }],
                        observations: [
                            { id: 2, text: 'A' },
                            { id: 3, text: 'B' },
                        ],
                        page: 1,
                    },
                ],
            });
        });
    });
});
