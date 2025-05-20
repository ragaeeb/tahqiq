import { describe, expect, it } from 'vitest';

import type { Transcript } from '@/stores/types';

import { CONTRACT_LATEST } from './constants';
import { adaptLegacyTranscripts, mapTranscriptsToLatestContract } from './legacy';

describe('legacy', () => {
    describe('adaptLegacyTranscripts', () => {
        it('should return unchanged modern v1.x format', () => {
            const modernFormat = {
                contractVersion: 'v1.0',
                createdAt: new Date('2023-01-01'),
                lastUpdatedAt: new Date('2023-01-02'),
                transcripts: [
                    {
                        segments: [{ end: 10, start: 0, text: 'test', tokens: [] }],
                        timestamp: new Date('2023-01-01'),
                        volume: 1,
                    },
                ],
            };

            const result = adaptLegacyTranscripts(modernFormat);
            expect(result).toEqual(modernFormat);
        });

        it('should convert v0.x format to latest contract version', () => {
            const timestamp = new Date('2023-01-01');
            const v0Format = {
                contractVersion: 'v0.9',
                createdAt: timestamp,
                lastUpdatedAt: timestamp,
                transcripts: [
                    {
                        timestamp,
                        tokens: [
                            { end: 5, start: 0, text: 'hello' },
                            { end: 10, start: 5, text: 'world' },
                        ],
                        volume: 1,
                    },
                ],
            };

            const expected = {
                contractVersion: CONTRACT_LATEST,
                createdAt: timestamp,
                lastUpdatedAt: timestamp,
                transcripts: [
                    {
                        segments: [
                            {
                                end: 10,
                                start: 0,
                                text: 'hello world',
                                tokens: [
                                    { end: 5, start: 0, text: 'hello' },
                                    { end: 10, start: 5, text: 'world' },
                                ],
                            },
                        ],
                        timestamp,
                        volume: 1,
                    },
                ],
            };

            const result = adaptLegacyTranscripts(v0Format);
            expect(result).toEqual(expected);
        });

        it('should convert v0.x format with URLs', () => {
            const timestamp = new Date('2023-01-01');
            const v0Format = {
                contractVersion: 'v0.9',
                createdAt: timestamp,
                lastUpdatedAt: timestamp,
                transcripts: [
                    {
                        timestamp,
                        tokens: [
                            { end: 5, start: 0, text: 'hello' },
                            { end: 10, start: 5, text: 'world' },
                        ],
                        urls: ['https://example.com'],
                        volume: 1,
                    },
                ],
            };

            const result = adaptLegacyTranscripts(v0Format);
            expect(result.transcripts[0]!.urls).toEqual(['https://example.com']);
        });

        it('should convert parts format to latest contract version', () => {
            const timestamp = new Date('2023-01-01');
            const partsFormat = {
                parts: [
                    {
                        part: 1,
                        timestamp,
                        transcripts: [
                            {
                                end: 10,
                                start: 0,
                                text: 'hello world',
                                tokens: [
                                    { end: 5, start: 0, text: 'hello' },
                                    { end: 10, start: 5, text: 'world' },
                                ],
                            },
                        ],
                    },
                ],
                timestamp,
                urls: ['https://example.com'],
            };

            const expected = {
                contractVersion: CONTRACT_LATEST,
                createdAt: timestamp,
                lastUpdatedAt: timestamp,
                transcripts: [
                    {
                        segments: [
                            {
                                end: 10,
                                start: 0,
                                text: 'hello world',
                                tokens: [
                                    { end: 5, start: 0, text: 'hello' },
                                    { end: 10, start: 5, text: 'world' },
                                ],
                            },
                        ],
                        timestamp,
                        volume: 1,
                    },
                ],
            };

            const result = adaptLegacyTranscripts(partsFormat);
            expect(result).toEqual(expected);
        });

        it('should throw an error for unrecognized formats', () => {
            const invalidFormat = {
                anotherProperty: 123,
                someProperty: 'value',
            };

            expect(() => adaptLegacyTranscripts(invalidFormat)).toThrow('Unrecognized transcript format');
        });
    });

    describe('mapTranscriptsToLatestContract', () => {
        it('should map transcripts to the latest contract format', () => {
            const createdAt = new Date('2023-01-01');
            const transcripts: Transcript[] = [
                {
                    segments: [
                        {
                            end: 5.678901,
                            start: 1.234567,
                            text: 'test segment',
                            tokens: [],
                        },
                    ],
                    timestamp: new Date('2023-01-02'),
                    volume: 2,
                },
                {
                    segments: [
                        {
                            end: 3.456789,
                            start: 0.123456,
                            text: 'first segment',
                            tokens: [],
                        },
                    ],
                    timestamp: new Date('2023-01-01'),
                    volume: 1,
                },
            ];

            const result = mapTranscriptsToLatestContract(transcripts, createdAt);

            expect(result.contractVersion).toBe(CONTRACT_LATEST);
            expect(result.createdAt).toBe(createdAt);
            expect(result.lastUpdatedAt).toBeInstanceOf(Date);

            // Check if volumes are sorted correctly
            expect(result.transcripts[0]!.volume).toBe(1);
            expect(result.transcripts[1]!.volume).toBe(2);

            // Check for rounded decimal values
            expect(result.transcripts[0]!.segments[0]!.start).toBe(0.12);
            expect(result.transcripts[0]!.segments[0]!.end).toBe(3.46);
            expect(result.transcripts[1]!.segments[0]!.start).toBe(1.23);
            expect(result.transcripts[1]!.segments[0]!.end).toBe(5.68);
        });

        it('should handle empty transcripts array', () => {
            const createdAt = new Date('2023-01-01');
            const result = mapTranscriptsToLatestContract([], createdAt);

            expect(result.contractVersion).toBe(CONTRACT_LATEST);
            expect(result.transcripts).toEqual([]);
        });
    });
});
