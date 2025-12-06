import { describe, expect, it } from 'bun:test';

import type { Transcript } from '@/stores/transcriptStore/types';

import { LatestContractVersion } from './constants';
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
            expect(result).toEqual(modernFormat as any);
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
                contractVersion: LatestContractVersion.Transcript,
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
                                body: 'hello world',
                                end: 10,
                                start: 0,
                                words: [
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
                contractVersion: LatestContractVersion.Transcript,
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
            const invalidFormat = { anotherProperty: 123, someProperty: 'value' };

            expect(() => adaptLegacyTranscripts(invalidFormat)).toThrow('Unrecognized transcript format');
        });

        it('should handle v1.x format with missing tokens in segments', () => {
            const modernFormat = {
                contractVersion: 'v1.0',
                createdAt: new Date('2023-01-01'),
                lastUpdatedAt: new Date('2023-01-02'),
                transcripts: [
                    {
                        segments: [
                            {
                                end: 10,
                                start: 0,
                                text: 'test segment without tokens',
                                // Note: no tokens property
                            },
                        ],
                        timestamp: new Date('2023-01-01'),
                        volume: 1,
                    },
                ],
            };

            const result = adaptLegacyTranscripts(modernFormat);

            // Should estimate tokens from segment text
            expect(result.transcripts[0]!.segments[0]!.tokens).toBeDefined();
            expect(Array.isArray(result.transcripts[0]!.segments[0]!.tokens)).toBe(true);
        });

        it('should handle BookTranscriptFormat with multiple parts', () => {
            const timestamp = new Date('2023-01-01');
            const bookFormat = {
                pages: [
                    {
                        body: 'First page content',
                        part: 2,
                        words: [
                            { end: 5, start: 0, text: 'First' },
                            { end: 10, start: 5, text: 'page' },
                        ],
                    },
                    {
                        body: 'Second page content',
                        part: 1,
                        words: [
                            { end: 15, start: 10, text: 'Second' },
                            { end: 20, start: 15, text: 'page' },
                        ],
                    },
                    {
                        body: 'Third page content',
                        part: 2,
                        words: [
                            { end: 25, start: 20, text: 'Third' },
                            { end: 30, start: 25, text: 'page' },
                        ],
                    },
                ],
                postProcessingApp: { id: 'test-app', version: '1.0' },
                timestamp,
                urls: ['https://example.com'],
            };

            const result = adaptLegacyTranscripts(bookFormat);

            expect(result.contractVersion).toBe(LatestContractVersion.Transcript);
            expect(result.transcripts).toHaveLength(2); // Two parts
            expect(result.postProcessingApps).toEqual([{ id: 'test-app', version: '1.0' }]);

            // Check that parts are sorted correctly
            expect(result.transcripts[0]!.volume).toBe(1);
            expect(result.transcripts[1]!.volume).toBe(2);

            // Check that pages are grouped by part
            expect(result.transcripts[0]!.segments[0]!.text).toBe('Second page content');
            expect(result.transcripts[1]!.segments[0]!.text).toBe('First page content\nThird page content');
        });

        it('should handle PartsWordsFormat without words property', () => {
            const timestamp = new Date('2023-01-01');
            const partsFormat = {
                parts: [
                    {
                        part: 1,
                        timestamp,
                        transcripts: [
                            {
                                body: 'first segment',
                                end: 5,
                                start: 0,
                                // Note: no words property
                            },
                            {
                                body: 'second segment',
                                end: 10,
                                start: 5,
                                // Note: no words property
                            },
                        ],
                    },
                ],
                postProcessingApp: { id: 'test-app', version: '1.0' },
                timestamp,
                urls: ['https://example.com'],
            };

            const result = adaptLegacyTranscripts(partsFormat);

            expect(result.contractVersion).toBe(LatestContractVersion.Transcript);
            expect(result.transcripts).toHaveLength(1);
            expect(result.transcripts[0]!.segments).toHaveLength(1);
            expect(result.transcripts[0]!.segments[0]!.text).toBe('first segment second segment');
            expect(result.transcripts[0]!.segments[0]!.start).toBe(0);
            expect(result.transcripts[0]!.segments[0]!.end).toBe(10);
            expect(result.transcripts[0]!.segments[0]!.tokens).toBeDefined();
        });

        it('should handle PartsWordsFormat without postProcessingApp', () => {
            const timestamp = new Date('2023-01-01');
            const partsFormat = {
                parts: [
                    {
                        part: 1,
                        timestamp,
                        transcripts: [
                            {
                                body: 'test segment',
                                end: 10,
                                start: 0,
                                words: [
                                    { end: 5, start: 0, text: 'test' },
                                    { end: 10, start: 5, text: 'segment' },
                                ],
                            },
                        ],
                    },
                ],
                timestamp,
                urls: ['https://example.com'],
                // Note: no postProcessingApp property
            };

            const result = adaptLegacyTranscripts(partsFormat);

            expect(result.contractVersion).toBe(LatestContractVersion.Transcript);
            expect(result.postProcessingApps).toBeUndefined();
        });

        it('should handle PartsWordsFormat with part-level urls', () => {
            const timestamp = new Date('2023-01-01');
            const partsFormat = {
                parts: [
                    {
                        part: 1,
                        timestamp,
                        transcripts: [
                            {
                                body: 'test segment',
                                end: 10,
                                start: 0,
                                words: [
                                    { end: 5, start: 0, text: 'test' },
                                    { end: 10, start: 5, text: 'segment' },
                                ],
                            },
                        ],
                        urls: ['https://part-specific.com'],
                    },
                ],
                postProcessingApp: { id: 'test-app', version: '1.0' },
                timestamp,
                urls: ['https://example.com'],
            };

            const result = adaptLegacyTranscripts(partsFormat);

            expect(result.transcripts[0]!.urls).toEqual(['https://part-specific.com']);
        });

        it('should handle v0.x format without urls', () => {
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
                        // Note: no urls property
                    },
                ],
            };

            const result = adaptLegacyTranscripts(v0Format);

            expect(result.transcripts[0]!.urls).toBeUndefined();
        });

        it('should handle v0.x format with empty urls array', () => {
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
                        urls: [], // Empty array
                        volume: 1,
                    },
                ],
            };

            const result = adaptLegacyTranscripts(v0Format);

            expect(result.transcripts[0]!.urls).toBeUndefined();
        });

        it('should handle PartsFormat with part-level urls', () => {
            const timestamp = new Date('2023-01-01');
            const partsFormat = {
                parts: [
                    {
                        part: 1,
                        timestamp,
                        transcripts: [
                            { body: 'hello', end: 5, start: 0, tokens: [{ end: 5, start: 0, text: 'hello' }] },
                            { body: 'world', end: 10, start: 5, tokens: [{ end: 10, start: 5, text: 'world' }] },
                        ],
                        urls: ['https://part-url.com'],
                    },
                ],
                timestamp,
                urls: ['https://example.com'],
            };

            const result = adaptLegacyTranscripts(partsFormat);

            expect(result.transcripts[0]!.urls).toEqual(['https://part-url.com']);
        });

        it('should handle empty parts array in PartsWordsFormat', () => {
            const timestamp = new Date('2023-01-01');
            const partsFormat = {
                parts: [],
                postProcessingApp: { id: 'test-app', version: '1.0' },
                timestamp,
                urls: ['https://example.com'],
            };

            const result = adaptLegacyTranscripts(partsFormat);

            expect(result.contractVersion).toBe(LatestContractVersion.Transcript);
            expect(result.transcripts).toEqual([]);
        });

        it('should handle empty parts array in PartsFormat', () => {
            const timestamp = new Date('2023-01-01');
            const partsFormat = { parts: [], timestamp, urls: ['https://example.com'] };

            const result = adaptLegacyTranscripts(partsFormat);

            expect(result.contractVersion).toBe(LatestContractVersion.Transcript);
            expect(result.transcripts).toEqual([]);
        });
    });

    describe('mapTranscriptsToLatestContract', () => {
        it('should map transcripts to the latest contract format', () => {
            const createdAt = new Date('2023-01-01');
            const transcripts: Transcript[] = [
                {
                    segments: [{ end: 5.678901, start: 1.234567, text: 'test segment', tokens: [] }],
                    timestamp: new Date('2023-01-02'),
                    volume: 2,
                },
                {
                    segments: [{ end: 3.456789, start: 0.123456, text: 'first segment', tokens: [] }],
                    timestamp: new Date('2023-01-01'),
                    volume: 1,
                },
            ];

            const result = mapTranscriptsToLatestContract({ createdAt, postProcessingApps: [], transcripts } as any);

            expect(result.contractVersion).toBe(LatestContractVersion.Transcript);
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
            const result = mapTranscriptsToLatestContract({
                createdAt,
                postProcessingApps: [],
                transcripts: [],
            } as any);

            expect(result.contractVersion).toBe(LatestContractVersion.Transcript);
            expect(result.transcripts).toEqual([]);
        });
    });
});
