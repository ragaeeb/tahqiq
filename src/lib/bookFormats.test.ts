import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import type { BookStateCore, Kitab } from '@/stores/bookStore/types';

import { mapBookStateToKitab, mapKitabToLegacyFormat } from './bookFormats';
import { LatestContractVersion } from './constants';

describe('bookFormats', () => {
    let mockDate: Date;
    let originalDateNow: () => number;

    beforeEach(() => {
        mockDate = new Date('2023-06-15T10:30:00Z');
        originalDateNow = Date.now;
        Date.now = () => mockDate.getTime();
        global.Date = class extends Date {
            constructor(...args: any[]) {
                if (args.length === 0) {
                    super(mockDate.getTime());
                } else {
                    // @ts-expect-error Spreading to mirror Date
                    super(...args);
                }
            }
        } as any;
    });

    afterEach(() => {
        Date.now = originalDateNow;
        global.Date = Date;
    });

    describe('mapBookStateToKitab', () => {
        it('should map book state to Kitab format with single volume', () => {
            const createdAt = new Date('2023-01-01T00:00:00Z');
            const bookState: BookStateCore = {
                createdAt,
                selectedVolume: 1,
                volumeToIndex: {
                    1: [
                        { id: 1, page: 1, title: 'Introduction' },
                        { id: 2, page: 10, title: 'Chapter 1' },
                    ],
                },
                volumeToPages: {
                    1: [
                        {
                            id: 1,
                            lastUpdate: Date.now(),
                            page: 1,
                            text: 'Introduction text',
                            volume: 1,
                            volumePage: 1,
                        },
                        {
                            footnotes: 'Some footnotes',
                            id: 2,
                            lastUpdate: Date.now(),
                            page: 10,
                            status: 'done',
                            text: 'Chapter 1 content',
                            volume: 1,
                            volumePage: 10,
                        },
                    ],
                },
            };

            const result = mapBookStateToKitab(bookState);

            expect(result).toEqual({
                contractVersion: LatestContractVersion.Book,
                createdAt,
                index: [
                    { page: 1, title: 'Introduction', volume: 1 },
                    { page: 10, title: 'Chapter 1', volume: 1 },
                ],
                lastUpdatedAt: mockDate,
                pages: [
                    {
                        page: 1,
                        text: 'Introduction text',
                        volume: 1,
                        volumePage: 1,
                    },
                    {
                        footnotes: 'Some footnotes',
                        page: 10,
                        status: 'done',
                        text: 'Chapter 1 content',
                        volume: 1,
                        volumePage: 10,
                    },
                ],
                type: 'book',
            });
        });

        it('should map book state with multiple volumes', () => {
            const createdAt = new Date('2023-01-01T00:00:00Z');
            const bookState: BookStateCore = {
                createdAt,
                selectedVolume: 1,
                volumeToIndex: {
                    1: [
                        { id: 1, page: 1, title: 'Vol 1 Introduction' },
                        { id: 2, page: 25, title: 'Vol 1 Chapter 1' },
                    ],
                    2: [
                        { id: 3, page: 50, title: 'Vol 2 Introduction' },
                        { id: 4, page: 75, title: 'Vol 2 Chapter 1' },
                    ],
                },
                volumeToPages: {
                    1: [
                        {
                            id: 1,
                            lastUpdate: Date.now(),
                            page: 1,
                            text: 'Volume 1 intro',
                            volume: 1,
                            volumePage: 1,
                        },
                    ],
                    2: [
                        {
                            id: 2,
                            lastUpdate: Date.now(),
                            page: 50,
                            text: 'Volume 2 intro',
                            volume: 2,
                            volumePage: 1,
                        },
                    ],
                },
            };

            const result = mapBookStateToKitab(bookState);

            // Index should be sorted by page number
            expect(result.index).toEqual([
                { page: 1, title: 'Vol 1 Introduction', volume: 1 },
                { page: 25, title: 'Vol 1 Chapter 1', volume: 1 },
                { page: 50, title: 'Vol 2 Introduction', volume: 2 },
                { page: 75, title: 'Vol 2 Chapter 1', volume: 2 },
            ]);

            expect(result.pages).toHaveLength(2);
            expect(result.pages[0]).toEqual({
                page: 1,
                text: 'Volume 1 intro',
                volume: 1,
                volumePage: 1,
            });
            expect(result.pages[1]).toEqual({
                page: 50,
                text: 'Volume 2 intro',
                volume: 2,
                volumePage: 1,
            });
        });

        it('should handle empty volumes', () => {
            const createdAt = new Date('2023-01-01T00:00:00Z');
            const bookState: BookStateCore = {
                createdAt,
                selectedVolume: 1,
                volumeToIndex: {},
                volumeToPages: {},
            };

            const result = mapBookStateToKitab(bookState);

            expect(result).toEqual({
                contractVersion: LatestContractVersion.Book,
                createdAt,
                index: [],
                lastUpdatedAt: mockDate,
                pages: [],
                type: 'book',
            });
        });

        it('should sort index by page number correctly', () => {
            const createdAt = new Date('2023-01-01T00:00:00Z');
            const bookState: BookStateCore = {
                createdAt,
                selectedVolume: 1,
                volumeToIndex: {
                    1: [
                        { id: 1, page: 100, title: 'Later chapter' },
                        { id: 2, page: 5, title: 'Early chapter' },
                        { id: 3, page: 50, title: 'Middle chapter' },
                    ],
                },
                volumeToPages: {},
            };

            const result = mapBookStateToKitab(bookState);

            expect(result.index).toEqual([
                { page: 5, title: 'Early chapter', volume: 1 },
                { page: 50, title: 'Middle chapter', volume: 1 },
                { page: 100, title: 'Later chapter', volume: 1 },
            ]);
        });

        it('should exclude id and lastUpdate from pages', () => {
            const createdAt = new Date('2023-01-01T00:00:00Z');
            const bookState: BookStateCore = {
                createdAt,
                selectedVolume: 1,
                volumeToIndex: {},
                volumeToPages: {
                    1: [
                        {
                            footnotes: 'Note',
                            id: 999, // Should be excluded
                            lastUpdate: 123456789, // Should be excluded
                            page: 1,
                            status: 'review',
                            text: 'Content',
                            volume: 1,
                            volumePage: 1,
                        },
                    ],
                },
            };

            const result = mapBookStateToKitab(bookState);

            expect(result.pages[0]).toEqual({
                footnotes: 'Note',
                page: 1,
                status: 'review',
                text: 'Content',
                volume: 1,
                volumePage: 1,
            });
            expect(result.pages[0]).not.toHaveProperty('id');
            expect(result.pages[0]).not.toHaveProperty('lastUpdate');
        });
    });

    describe('mapKitabToLegacyFormat', () => {
        it('should convert Kitab to legacy format', () => {
            const kitab: Kitab = {
                contractVersion: 'v1.0',
                createdAt: new Date('2023-01-01T00:00:00Z'),
                index: [
                    { page: 1, title: 'Introduction', volume: 1 },
                    { page: 25, title: 'Chapter 1', volume: 1 },
                ],
                lastUpdatedAt: new Date('2023-06-15T10:30:00Z'),
                pages: [
                    {
                        page: 1,
                        text: 'Introduction content',
                        volume: 1,
                        volumePage: 1,
                    },
                    {
                        footnotes: 'Important footnote',
                        page: 25,
                        status: 'done',
                        text: 'Chapter 1 content',
                        volume: 1,
                        volumePage: 25,
                    },
                ],
                type: 'book',
            };

            const result = mapKitabToLegacyFormat(kitab);

            expect(result).toEqual({
                bookmarks: [
                    { page: 1, title: 'Introduction', volume: 1 },
                    { page: 25, title: 'Chapter 1', volume: 1 },
                ],
                pages: [
                    {
                        body: 'Introduction content',
                        page: 1,
                        part: 1,
                        pp: 1,
                    },
                    {
                        body: 'Chapter 1 content_\nImportant footnote',
                        page: 25,
                        part: 1,
                        pp: 25,
                    },
                ],
            });
        });

        it('should handle pages without footnotes', () => {
            const kitab: Kitab = {
                contractVersion: 'v1.0',
                createdAt: new Date('2023-01-01T00:00:00Z'),
                index: [],
                lastUpdatedAt: new Date('2023-06-15T10:30:00Z'),
                pages: [
                    {
                        page: 1,
                        text: 'Content without footnotes',
                        volume: 1,
                        volumePage: 1,
                    },
                ],
                type: 'book',
            };

            const result = mapKitabToLegacyFormat(kitab);

            expect(result.pages[0]!.body).toBe('Content without footnotes');
        });

        it('should handle pages with empty text', () => {
            const kitab: Kitab = {
                contractVersion: 'v1.0',
                createdAt: new Date('2023-01-01T00:00:00Z'),
                index: [],
                lastUpdatedAt: new Date('2023-06-15T10:30:00Z'),
                pages: [
                    {
                        footnotes: 'Only footnotes',
                        page: 1,
                        text: '',
                        volume: 1,
                        volumePage: 1,
                    },
                ],
                type: 'book',
            };

            const result = mapKitabToLegacyFormat(kitab);

            expect(result.pages[0]!.body).toBe('Only footnotes');
        });

        it('should handle pages with undefined volume and volumePage', () => {
            const kitab: Kitab = {
                contractVersion: 'v1.0',
                createdAt: new Date('2023-01-01T00:00:00Z'),
                index: [],
                lastUpdatedAt: new Date('2023-06-15T10:30:00Z'),
                pages: [
                    {
                        page: 1,
                        text: 'Content',
                        // volume and volumePage are undefined
                    },
                ],
                type: 'book',
            };

            const result = mapKitabToLegacyFormat(kitab);

            expect(result.pages[0]).toEqual({
                body: 'Content',
                page: 1,
                part: undefined,
                pp: undefined,
            });
        });

        it('should handle empty pages and index', () => {
            const kitab: Kitab = {
                contractVersion: 'v1.0',
                createdAt: new Date('2023-01-01T00:00:00Z'),
                index: [],
                lastUpdatedAt: new Date('2023-06-15T10:30:00Z'),
                pages: [],
                type: 'book',
            };

            const result = mapKitabToLegacyFormat(kitab);

            expect(result).toEqual({
                bookmarks: [],
                pages: [],
            });
        });

        it('should filter out falsy values when joining text and footnotes', () => {
            const kitab: Kitab = {
                contractVersion: 'v1.0',
                createdAt: new Date('2023-01-01T00:00:00Z'),
                index: [],
                lastUpdatedAt: new Date('2023-06-15T10:30:00Z'),
                pages: [
                    {
                        footnotes: '', // Empty string should be filtered out
                        page: 1,
                        text: 'Main text',
                        volume: 1,
                        volumePage: 1,
                    },
                    {
                        footnotes: undefined, // Undefined should be filtered out
                        page: 2,
                        text: '',
                        volume: 1,
                        volumePage: 2,
                    },
                ],
                type: 'book',
            };

            const result = mapKitabToLegacyFormat(kitab);

            expect(result.pages[0]!.body).toBe('Main text');
            expect(result.pages[1]!.body).toBe('');
        });
    });
});
