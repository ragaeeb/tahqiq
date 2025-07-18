import { describe, expect, it } from 'bun:test';

import { mapManuscriptToJuz } from './manuscript';

describe('manuscript', () => {
    describe('mapManuscriptToJuz', () => {
        it('should convert HH:MM:SS format correctly', () => {
            const sheets = [
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
                    page: 2,
                },
            ];

            const actual = mapManuscriptToJuz({
                idsFilter: new Set(),
                isInitialized: true,
                sheets,
            });

            expect(actual).toEqual({
                contractVersion: 'v2.0',
                sheets,
                timestamp: expect.any(Date),
                type: 'juz',
            });
        });
    });
});
