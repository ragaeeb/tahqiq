import { describe, expect, it } from 'bun:test';

import { mapManuscriptToJuz } from './manuscript';

describe('manuscript', () => {
    describe('mapManuscriptToJuz', () => {
        it('should convert manuscript state to Juz format correctly', () => {
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
                postProcessingApps: [],
                sheets,
            });

            expect(actual).toEqual({
                contractVersion: 'v2.0',
                postProcessingApps: [
                    { id: expect.any(String), timestamp: expect.any(Date), version: expect.any(String) },
                ],
                sheets,
                timestamp: expect.any(Date),
                type: 'juz',
            });
        });

        it('should handle empty sheets array', () => {
            const actual = mapManuscriptToJuz({
                idsFilter: new Set(),
                isInitialized: true,
                postProcessingApps: [],
                sheets: [],
            });

            expect(actual.sheets).toEqual([]);
        });

        it('should handle uninitialized state', () => {
            const actual = mapManuscriptToJuz({
                idsFilter: new Set(),
                isInitialized: false,
                postProcessingApps: [],
                sheets: [],
            });

            expect(actual.sheets).toEqual([]);
        });
    });
});
