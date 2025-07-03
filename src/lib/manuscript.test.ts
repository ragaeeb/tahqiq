import { describe, expect, it } from 'bun:test';

import { mapManuscriptToJuz } from './manuscript';

describe('manuscript', () => {
    describe('mapManuscriptToJuz', () => {
        it('should convert HH:MM:SS format correctly', () => {
            const actual = mapManuscriptToJuz({
                idsFilter: new Set(),
                sheets: [
                    {
                        alt: [],
                        observations: [
                            {
                                bbox: { height: 1, width: 2, x: 3, y: 4 },
                                id: 1,
                                isCentered: true,
                                isHeading: true,
                                isPoetic: true,
                                lastUpdate: 2,
                                text: 'T',
                            },
                            {
                                bbox: { height: 1, width: 1, x: 1, y: 1 },
                                id: 1,
                                isFootnote: true,
                                lastUpdate: 2,
                                text: 'F',
                            },
                        ],
                        page: 1,
                    },
                ],
            });

            expect(actual).toEqual({
                contractVersion: 'v1.0',
                index: [
                    {
                        page: 1,
                        title: 'T',
                    },
                ],
                sheets: [
                    {
                        footnotes: 'F',
                        page: 1,
                        text: 'T',
                    },
                ],
                timestamp: expect.any(Date),
                type: 'juz',
            });
        });
    });
});
