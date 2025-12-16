import { describe, expect, it } from 'bun:test';

import { adaptExcerptsToLatest } from './migration';

describe.skip('migration', () => {
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

        it('should migrate patternToOptions to slices', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { patternToOptions: { '^((بَابُ|word2|word3).*)': { type: 2 }, '^(بَابٌ)': { type: 2 } } },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.slices).toBeDefined();
            expect(result.options?.slices).toHaveLength(2);

            const firstOption = result.options.slices[0]!;
            expect(firstOption.lineStartsWith).toEqual(['بَابُ', 'word2', 'word3']);
            expect(firstOption.meta).toEqual({ type: 'chapter' });

            const secondOption = result.options.slices[1]!;
            expect(secondOption.lineStartsWith).toEqual(['بَابٌ']);
            expect(secondOption.meta).toEqual({ type: 'chapter' });
        });

        it('should convert raqm patterns to template tokens', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { patternToOptions: { '^(([\\u0660-\\u0669]+\\s?[-–—ـ]).*)': {} } },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.slices).toHaveLength(1);
            const option = result.options.slices[0]!;
            expect(option.lineStartsWith).toEqual(['{{raqms}}\\s?{{dash}}']);
            expect(option.meta).toBeUndefined();
        });

        it('should preserve min/max page constraints', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { patternToOptions: { '^(بَابُ.*)': { maxPage: 100, minPage: 10, type: 2 } } },
            };

            const result = adaptExcerptsToLatest(data);

            const option = result.options.slices[0]!;
            expect(option.min).toBe(10);
            expect(option.max).toBe(100);
        });

        it('should not override existing slices', () => {
            const existingSlicingOptions = [{ lineStartsWith: ['existing'] }];
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { patternToOptions: { '^(بَابُ.*)': { type: 2 } }, slices: existingSlicingOptions },
            };

            const result = adaptExcerptsToLatest(data);

            expect(result.options?.slices).toBe(existingSlicingOptions);
        });

        it('should handle empty patternToOptions', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { footnotes: true, patternToOptions: {} },
            };

            const result = adaptExcerptsToLatest(data);

            expect(result.options?.slices).toBeUndefined();
            expect(result.options?.footnotes).toBe(true);
        });

        it('should handle complex nested patterns', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { patternToOptions: { '^(([\\u0660-\\u0669]+\\s?[-–—ـ]|•|وَاعْلَمْ|حَدَّثَنَا).*)': {} } },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.slices).toHaveLength(1);
            const option = result.options.slices[0]!;
            expect(option.lineStartsWith).toEqual(['{{raqms}}\\s?{{dash}}', '•', 'وَاعْلَمْ', 'حَدَّثَنَا']);
        });

        it('should convert type 1 to book', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { patternToOptions: { '^(كِتَابُ.*)': { type: 1 } } },
            };

            const result = adaptExcerptsToLatest(data);

            const option = result.options.slices[0]!;
            expect(option.meta).toEqual({ type: 'book' });
        });

        it('should migrate excludePages range to omit', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { excludePages: ['1-33'] },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.omit).toHaveLength(1);
            expect(result.options.omit[0]).toEqual({ from: 1, to: 33 });
        });

        it('should migrate excludePages list to omit', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { excludePages: ['1,3,5'] },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.omit).toHaveLength(1);
            expect(result.options.omit[0]).toEqual({ pages: [1, 3, 5] });
        });

        it('should migrate excludePages single page to omit', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { excludePages: ['5'] },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.omit).toHaveLength(1);
            expect(result.options.omit[0]).toEqual({ pages: [5] });
        });

        it('should migrate excludePagesWithPatterns to omit', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { excludePagesWithPatterns: ['^\\d+'] },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.omit).toHaveLength(1);
            expect(result.options.omit[0]).toEqual({ regex: '^\\d+' });
        });

        it('should migrate multiple excludePages entries to omit', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { excludePages: ['1-33', '5', '10,20,30'] },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.omit).toHaveLength(3);
            expect(result.options.omit[0]).toEqual({ from: 1, to: 33 });
            expect(result.options.omit[1]).toEqual({ pages: [5] });
            expect(result.options.omit[2]).toEqual({ pages: [10, 20, 30] });
        });

        it('should combine excludePages and excludePagesWithPatterns in omit', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { excludePages: ['1-33'], excludePagesWithPatterns: ['^\\d+', 'pattern2'] },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.omit).toHaveLength(3);
            expect(result.options.omit[0]).toEqual({ from: 1, to: 33 });
            expect(result.options.omit[1]).toEqual({ regex: '^\\d+' });
            expect(result.options.omit[2]).toEqual({ regex: 'pattern2' });
        });

        it('should not override existing omit', () => {
            const existingOmit = [{ pages: [99] }];
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { excludePages: ['1-33'], omit: existingOmit },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.omit).toBe(existingOmit);
        });

        it('should handle empty excludePages', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { excludePages: [], footnotes: true },
            };

            const result = adaptExcerptsToLatest(data);

            expect(result.options?.omit).toBeUndefined();
            expect(result.options?.footnotes).toBe(true);
        });

        it('should migrate replacements to replace', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { replacements: { Text: '', X: 'Y' } },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.replace).toHaveLength(2);
            expect(result.options.replace[0]).toEqual({ from: { regex: 'Text' }, to: '' });
            expect(result.options.replace[1]).toEqual({ from: { regex: 'X' }, to: 'Y' });
        });

        it('should migrate single replacement to replace', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { replacements: { 'Remove This': '' } },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.replace).toHaveLength(1);
            expect(result.options.replace[0]).toEqual({ from: { regex: 'Remove This' }, to: '' });
        });

        it('should not override existing replace', () => {
            const existingReplace = [{ from: { regex: 'existing' }, to: 'replaced' }];
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { replace: existingReplace, replacements: { Text: '' } },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.replace).toBe(existingReplace);
        });

        it('should handle empty replacements', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { footnotes: true, replacements: {} },
            };

            const result = adaptExcerptsToLatest(data);

            expect(result.options?.replace).toBeUndefined();
            expect(result.options?.footnotes).toBe(true);
        });

        it('should convert Unicode patterns to template tokens in replacements', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { replacements: { '[-–—ـ]': '-', '[\\u0660-\\u0669]+': '' } },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.replace).toHaveLength(2);
            expect(result.options.replace).toContainEqual({ from: { template: '{{raqms}}' }, to: '' });
            expect(result.options.replace).toContainEqual({ from: { template: '{{dash}}' }, to: '-' });
        });

        it('should use regex for non-convertible patterns in replacements', () => {
            const data = {
                contractVersion: 'v2.0',
                excerpts: [],
                footnotes: [],
                headings: [],
                options: { replacements: { '[\\u0660-\\u0669]+\\s?[-–—ـ]': '', 'plain text': 'replaced' } },
            };

            const result: any = adaptExcerptsToLatest(data);

            expect(result.options?.replace).toHaveLength(2);
            expect(result.options.replace).toContainEqual({ from: { regex: 'plain text' }, to: 'replaced' });
            expect(result.options.replace).toContainEqual({ from: { template: '{{raqms}}\\s?{{dash}}' }, to: '' });
        });
    });
});
