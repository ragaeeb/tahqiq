import { describe, expect, it } from 'bun:test';

import { alignAndMergeAltPoetry, mergeWithBelow } from './actions';

describe('actions', () => {
    describe('merge', () => {
        it('bug with alt not merging properly even though asl does', () => {});
    });

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

    describe('alignAndMergeAltPoetry', () => {
        it('should align the poetic alt', () => {
            const observations = [
                {
                    text: 'A',
                },
                {
                    isPoetic: true,
                    text: 'قد قُدِّم العَجْبُ على الرُّوَيس وشارف الوهدُ أبا قُبيسِ',
                },
                {
                    isPoetic: true,
                    text: 'وطاول البقلُ فروعَ الميْس وهبت العنز لقرع التيسِ',
                },
                {
                    isPoetic: true,
                    text: 'وادَّعت الروم أبًا في قيس واختلط الناس اختلاط الحيسِ',
                },
                {
                    isPoetic: true,
                    text: 'إذ قرا القاضي حليف الكيس معاني الشعر على العبيسي',
                },
                {
                    text: 'B',
                },
            ];

            const alt = [
                {
                    text: 'A',
                },
                {
                    text: 'قد قُدِّم العَجْبُ على الرُّوَيس وشـارف الوهـدُ أبــا قُبيس',
                },
                {
                    text: 'وطاول البقلُ فروعَ الميْس',
                },
                {
                    text: 'وهبت العنـز لـقرع التـيس',
                },
                {
                    text: 'واختلط الناس اختلاط الحيس',
                },
                {
                    text: 'وادَّعت الروم أبًا في قيس',
                },
                {
                    text: 'معـاني الشعر على العـبـيــسـي',
                },
                {
                    text: 'إذ قرا القاضي حليف الكيس',
                },
                {
                    text: 'B',
                },
            ];

            const merged = alignAndMergeAltPoetry({
                alt,
                observations,
            } as any);

            expect(merged).toEqual([
                {
                    text: 'A',
                },
                {
                    text: 'قد قُدِّم العَجْبُ على الرُّوَيس وشـارف الوهـدُ أبــا قُبيس',
                },
                {
                    id: expect.any(Number),
                    text: ['وطاول البقلُ فروعَ الميْس', 'وهبت العنـز لـقرع التـيس'].join(' '),
                },
                {
                    id: expect.any(Number),
                    text: ['وادَّعت الروم أبًا في قيس', 'واختلط الناس اختلاط الحيس'].join(' '),
                },
                {
                    id: expect.any(Number),
                    text: ['إذ قرا القاضي حليف الكيس', 'معـاني الشعر على العـبـيــسـي'].join(' '),
                },
                {
                    text: 'B',
                },
            ] as any);
        });
    });
});
