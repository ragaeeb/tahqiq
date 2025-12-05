import { describe, expect, it } from 'bun:test';

import { adaptExcerptsToLatest } from './migration';

describe('migration', () => {
    describe('adaptExcerptsToLatest', () => {
        it('should return v3.0 data unchanged', () => {
            const v3Data = {
                contractVersion: 'v3.0',
                excerpts: [
                    {
                        from: 1,
                        id: '1',
                        lastUpdatedAt: 1234567890,
                        nass: 'نص عربي',
                        text: 'English text',
                        translator: 890,
                        vol: 1,
                        vp: 5,
                    },
                ],
                footnotes: [],
                headings: [
                    { from: 1, id: 'h1', lastUpdatedAt: 1234567890, nass: 'عنوان', text: 'Heading', translator: 890 },
                ],
            };

            const result = adaptExcerptsToLatest(v3Data);

            expect(result).toBe(v3Data);
            expect(result.contractVersion).toBe('v3.0');
        });

        it('should return v3.1 data unchanged', () => {
            const v31Data = { contractVersion: 'v3.1', excerpts: [], footnotes: [], headings: [] };

            const result = adaptExcerptsToLatest(v31Data);

            expect(result).toBe(v31Data);
        });

        it('should migrate v2.x data to v3.0 format', () => {
            const v2Data = {
                contractVersion: 'v2.0',
                excerpts: [
                    {
                        arabic: 'نص عربي',
                        collection: 1,
                        from: 10,
                        id: 'e1',
                        lastUpdatedAt: 1234567890,
                        pp: 5,
                        to: 12,
                        translation: 'English text',
                        translator: 891,
                        volume: 2,
                    },
                ],
                footnotes: [],
                headings: [
                    {
                        from: 10,
                        id: 'h1',
                        lastUpdatedAt: 1234567890,
                        nass: 'عنوان الباب',
                        parent: 'h0',
                        text: 'Chapter Title',
                        translator: 891,
                    },
                ],
            };

            const result = adaptExcerptsToLatest(v2Data);

            expect(result.contractVersion).toBe('v3.0');
            expect(result.lastUpdatedAt).toBeDefined();

            // Check excerpt migration
            expect(result.excerpts).toHaveLength(1);
            const excerpt = result.excerpts[0]!;
            expect(excerpt.id).toBe('e1');
            expect(excerpt.nass).toBe('نص عربي');
            expect(excerpt.text).toBe('English text');
            expect(excerpt.vol).toBe(2);
            expect(excerpt.vp).toBe(5);
            expect(excerpt.from).toBe(10);
            expect(excerpt.to).toBe(12);
            expect(excerpt.translator).toBe(891);
            expect(excerpt.lastUpdatedAt).toBe(1234567890 / 1000);

            // Check heading migration
            expect(result.headings).toHaveLength(1);
            const heading = result.headings[0]!;
            expect(heading.id).toBe('h1');
            expect(heading.nass).toBe('عنوان الباب');
            expect(heading.text).toBe('Chapter Title');
            expect(heading.from).toBe(10);
            expect(heading.parent).toBe('h0');
            expect(heading.translator).toBe(891);
            expect(heading.lastUpdatedAt).toBe(1234567890 / 1000);
        });

        it('should migrate data without contractVersion', () => {
            const legacyData = {
                excerpts: [
                    {
                        arabic: 'نص',
                        collection: 1,
                        from: 1,
                        id: 'e1',
                        lastUpdatedAt: 1111111111,
                        pp: 1,
                        translation: 'text',
                        translator: 890,
                        volume: 1,
                    },
                ],
                footnotes: [],
                headings: [],
            };

            const result = adaptExcerptsToLatest(legacyData);

            expect(result.contractVersion).toBe('v3.0');
            expect(result.excerpts[0]!.nass).toBe('نص');
        });

        it('should migrate v1.x data to v3.0 format', () => {
            const v1Data = {
                contractVersion: 'v1.0',
                excerpts: [
                    {
                        arabic: 'محتوى',
                        collection: 1,
                        from: 5,
                        id: 'e1',
                        lastUpdatedAt: 9999999999,
                        pp: 3,
                        translation: 'content',
                        translator: 889,
                        volume: 3,
                    },
                ],
                footnotes: [],
                headings: [],
            };

            const result = adaptExcerptsToLatest(v1Data);

            expect(result.contractVersion).toBe('v3.0');
            expect(result.excerpts[0]!.vol).toBe(3);
            expect(result.excerpts[0]!.vp).toBe(3);
        });

        it('should preserve optional to field when present', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [
                    {
                        arabic: 'نص',
                        collection: 1,
                        from: 10,
                        id: 'e1',
                        lastUpdatedAt: 1234567890,
                        pp: 10,
                        to: 15,
                        translation: 'text',
                        translator: 890,
                        volume: 1,
                    },
                ],
                footnotes: [],
                headings: [],
            };

            const result = adaptExcerptsToLatest(data);

            expect(result.excerpts[0]!.to).toBe(15);
        });

        it('should handle heading without parent', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [
                    { from: 1, id: 'h1', lastUpdatedAt: 1234567890, nass: 'عنوان', text: 'Heading', translator: 890 },
                ],
            };

            const result = adaptExcerptsToLatest(data);

            expect(result.headings[0]!.parent).toBeUndefined();
        });

        it('should preserve footnotes unchanged', () => {
            const footnoteData = {
                from: 1,
                id: 'f1',
                lastUpdatedAt: 1234567890,
                nass: 'حاشية',
                text: 'footnote',
                translator: 890,
                vol: 1,
                vp: 1,
            };

            const data = { contractVersion: 'v2.0', excerpts: [], footnotes: [footnoteData], headings: [] };

            const result = adaptExcerptsToLatest(data);

            expect(result.footnotes).toEqual([footnoteData]);
        });

        it('should preserve other Excerpts properties', () => {
            const data = {
                collection: { id: 'test', title: 'Test Collection' },
                contractVersion: 'v2.0',
                createdAt: 1234567890,
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { footnotes: true },
                prompt: 'Custom prompt',
            };

            const result = adaptExcerptsToLatest(data);

            expect(result.collection).toEqual({ id: 'test', title: 'Test Collection' });
            expect(result.createdAt).toBe(1234567890);
            expect(result.options).toEqual({ footnotes: true });
            expect(result.prompt).toBe('Custom prompt');
        });
    });
});
