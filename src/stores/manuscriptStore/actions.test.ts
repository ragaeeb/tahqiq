import { describe, expect, it } from 'bun:test';

import { alignAndMergeAltPoetry, merge, mergeWithBelow } from './actions';

describe('actions', () => {
    describe('merge', () => {
        it('bug with alt not merging properly even though asl does', () => {
            const state = {
                sheets: [
                    {
                        alt: ['A', 'B', 'C'],
                        observations: [
                            { bbox: {}, id: 2, text: 'A' },
                            { bbox: {}, id: 3, text: 'B' },
                            { bbox: {}, id: 4, text: 'C' },
                        ],
                        page: 1,
                    },
                ],
            } as any;

            merge(state, 1, [2, 3, 4]);

            expect(state).toEqual({
                sheets: [
                    {
                        alt: ['A B C'],
                        observations: [
                            {
                                bbox: expect.any(Object),
                                id: 2,
                                isCentered: false,
                                isHeading: false,
                                isPoetic: false,
                                lastUpdate: expect.any(Number),
                                text: 'A B C',
                            },
                        ],
                        page: 1,
                    },
                ],
            });
        });
    });

    describe('mergeWithBelow', () => {
        it('should merge the row with the one below it', () => {
            const state = {
                sheets: [
                    {
                        alt: ['A', 'B'],
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
                        alt: ['B A'],
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

    describe('alignAndMergeAltPoetry', () => {
        it('should align the poetic alt', () => {
            const observations = [
                { text: 'A' },
                { isPoetic: true, text: 'قد قُدِّم العَجْبُ على الرُّوَيس وشارف الوهدُ أبا قُبيسِ' },
                { isPoetic: true, text: 'وطاول البقلُ فروعَ الميْس وهبت العنز لقرع التيسِ' },
                { isPoetic: true, text: 'وادَّعت الروم أبًا في قيس واختلط الناس اختلاط الحيسِ' },
                { isPoetic: true, text: 'إذ قرا القاضي حليف الكيس معاني الشعر على العبيسي' },
                { text: 'B' },
            ];

            const alt = [
                'A',
                'قد قُدِّم العَجْبُ على الرُّوَيس وشـارف الوهـدُ أبــا قُبيس',
                'وطاول البقلُ فروعَ الميْس',
                'وهبت العنـز لـقرع التـيس',
                'واختلط الناس اختلاط الحيس',
                'وادَّعت الروم أبًا في قيس',
                'معـاني الشعر على العـبـيــسـي',
                'إذ قرا القاضي حليف الكيس',
                'B',
            ];

            const merged = alignAndMergeAltPoetry({ alt, observations } as any);

            expect(merged).toEqual([
                'A',
                'قد قُدِّم العَجْبُ على الرُّوَيس وشـارف الوهـدُ أبــا قُبيس',
                ['وطاول البقلُ فروعَ الميْس', 'وهبت العنـز لـقرع التـيس'].join(' '),
                ['وادَّعت الروم أبًا في قيس', 'واختلط الناس اختلاط الحيس'].join(' '),
                ['إذ قرا القاضي حليف الكيس', 'معـاني الشعر على العـبـيــسـي'].join(' '),
                'B',
            ] as any);
        });
    });
});
