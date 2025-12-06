import { describe, expect, it } from 'bun:test';

import { segmentPages } from './segmenter';
import type { PageInput, SlicingOption } from './types';

describe('segmenter', () => {
    describe('segmentPages', () => {
        it('should segment a single plain-text page with 3 numeric markers', () => {
            // Single page with 3 entries, each starting with Arabic numeral + dash
            const pages: PageInput[] = [
                { content: '١ - الحديث الأول\r٢ - الحديث الثاني\r٣ - الحديث الثالث', id: 100, page: 1, part: '1' },
            ];

            const slices: SlicingOption[] = [
                { regex: '^[٠-٩]+ - ' }, // Match Arabic number + dash at line start
            ];

            const result = segmentPages(pages, { slices });

            expect(result).toHaveLength(3);
            expect(result[0]).toMatchObject({ content: '١ - الحديث الأول', from: 100 });
            expect(result[1]).toMatchObject({ content: '٢ - الحديث الثاني', from: 100 });
            expect(result[2]).toMatchObject({ content: '٣ - الحديث الثالث', from: 100 });
        });

        it('should segment a single page with HTML title markers', () => {
            // Single page with HTML span markers for titles
            const pages: PageInput[] = [
                {
                    content:
                        '<span data-type="title" id=toc-1>باب الأول</span>\rنص الباب الأول\r<span data-type="title" id=toc-2>باب الثاني</span>\rنص الباب الثاني',
                    id: 200,
                    page: 5,
                    part: '1',
                },
            ];

            const slices: SlicingOption[] = [
                { regex: '^<span data-type="title"' }, // Match title span at line start
            ];

            const result = segmentPages(pages, { slices });

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({
                content: '<span data-type="title" id=toc-1>باب الأول</span>\nنص الباب الأول',
                from: 200,
            });
            expect(result[1]).toMatchObject({
                content: '<span data-type="title" id=toc-2>باب الثاني</span>\nنص الباب الثاني',
                from: 200,
            });
        });

        it('should handle content spanning across 2 pages with space joining', () => {
            // Page 1: entry 1 complete, entry 2 starts but continues to page 2
            // Page 2: continuation of entry 2, then entry 3 starts
            const pages: PageInput[] = [
                { content: '١ - الحديث الأول كامل\r٢ - بداية الحديث الثاني', id: 300, page: 10, part: '1' },
                { content: 'تكملة الحديث الثاني\r٣ - الحديث الثالث', id: 301, page: 11, part: '1' },
            ];

            const slices: SlicingOption[] = [
                { regex: '^[٠-٩]+ - ' }, // Match Arabic number + dash at line start
            ];

            const result = segmentPages(pages, { slices });

            expect(result).toHaveLength(3);
            expect(result[0]).toMatchObject({ content: '١ - الحديث الأول كامل', from: 300 });
            // Entry 2 spans pages - should be joined with space, not newline
            expect(result[1]).toMatchObject({
                content: '٢ - بداية الحديث الثاني تكملة الحديث الثاني',
                from: 300,
                to: 301,
            });
            expect(result[2]).toMatchObject({ content: '٣ - الحديث الثالث', from: 301 });
        });

        it('should extract capture groups when regex has them', () => {
            // Use capture groups to extract content from markers
            const pages: PageInput[] = [
                { content: '١ - الحديث الأول\r٢ - الحديث الثاني', id: 400, page: 1, part: '1' },
            ];

            const slices: SlicingOption[] = [
                // Capture group: extract just the content after the marker
                { regex: '^[٠-٩]+ - (.*)' },
            ];

            const result = segmentPages(pages, { slices });

            expect(result).toHaveLength(2);
            // Should return only the captured content, not the full match
            expect(result[0]).toMatchObject({ content: 'الحديث الأول', from: 400 });
            expect(result[1]).toMatchObject({ content: 'الحديث الثاني', from: 400 });
        });

        it('should extract title content from HTML span using capture groups', () => {
            // Extract the text inside the span tag
            const pages: PageInput[] = [
                {
                    content:
                        '<span data-type="title" id=toc-1>باب الأول</span>\rنص الباب\r<span data-type="title" id=toc-2>باب الثاني</span>',
                    id: 500,
                    page: 1,
                    part: '1',
                },
            ];

            const slices: SlicingOption[] = [
                // Capture: extract text inside the span AND anything after the closing tag
                { regex: '^<span data-type="title"[^>]*>([^<]+)</span>(.*)' },
            ];

            const result = segmentPages(pages, { slices });

            expect(result).toHaveLength(2);
            // First capture group + second capture group combined, plus continuation
            expect(result[0]).toMatchObject({ content: 'باب الأول\nنص الباب', from: 500 });
            expect(result[1]).toMatchObject({ content: 'باب الثاني', from: 500 });
        });

        it('should capture toc ID from HTML span when pattern includes ID capture', () => {
            // Extract both ID and content from span
            const pages: PageInput[] = [
                {
                    content: '<span data-type="title" id=toc-42>الفصل الأول</span>\rمحتوى الفصل',
                    id: 600,
                    page: 1,
                    part: '1',
                },
            ];

            const slices: SlicingOption[] = [
                // Capture ID in first group, content in second
                { regex: '^<span data-type="title" id=toc-([0-9]+)>([^<]+)</span>' },
            ];

            const result = segmentPages(pages, { slices });

            expect(result).toHaveLength(1);
            // Captured groups are joined, then continuation added
            expect(result[0]).toMatchObject({
                // The ID should be exposed somehow - maybe in a captures property?
                captures: ['42', 'الفصل الأول'],
                content: 'الفصل الأول\nمحتوى الفصل',
                from: 600,
            });
        });

        it('should strip HTML for pattern matching when stripHtml option is true', () => {
            // Real Bukhari hadith example with narrator links and hadeeth markers
            const pages: PageInput[] = [
                {
                    content:
                        '٦٦٩٦ - حَدَّثَنَا <a href="inr://man-5093">أَبُو نُعَيْمٍ، </a>حَدَّثَنَا <a href="inr://man-5361">مَالِكٌ، </a>عَنْ <a href="inr://man-2998">طَلْحَةَ بْنِ عَبْدِ الْمَلِكِ، </a>عَنِ <a href="inr://man-5159">الْقَاسِمِ، </a>عَنْ <a href="inr://man-3026">عَائِشَةَ </a>﵂، عَنِ النَّبِيِّ ﷺ قَالَ: <hadeeth-2359>«مَنْ نَذَرَ أَنْ يُطِيعَ اللهَ فَلْيُطِعْهُ، وَمَنْ نَذَرَ أَنْ يَعْصِيَهُ فَلَا يَعْصِهِ.» <hadeeth>',
                    id: 9996,
                    page: 142,
                    part: '8',
                },
            ];

            const slices: SlicingOption[] = [
                // Pattern without content capture - just detect the marker
                // Use capture for hadith number only (for metadata)
                { regex: '^([٠-٩]+) - ' },
            ];

            const result = segmentPages(pages, { slices, stripHtml: true });

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                // captures should have just the hadith number
                captures: ['٦٦٩٦'],
                // content should be the full stripped line (since no content capture group)
                content:
                    '٦٦٩٦ - حَدَّثَنَا أَبُو نُعَيْمٍ، حَدَّثَنَا مَالِكٌ، عَنْ طَلْحَةَ بْنِ عَبْدِ الْمَلِكِ، عَنِ الْقَاسِمِ، عَنْ عَائِشَةَ ﵂، عَنِ النَّبِيِّ ﷺ قَالَ: «مَنْ نَذَرَ أَنْ يُطِيعَ اللهَ فَلْيُطِعْهُ، وَمَنْ نَذَرَ أَنْ يَعْصِيَهُ فَلَا يَعْصِهِ.» ',
                from: 9996,
                // html should preserve the original with tags
                html: '٦٦٩٦ - حَدَّثَنَا <a href="inr://man-5093">أَبُو نُعَيْمٍ، </a>حَدَّثَنَا <a href="inr://man-5361">مَالِكٌ، </a>عَنْ <a href="inr://man-2998">طَلْحَةَ بْنِ عَبْدِ الْمَلِكِ، </a>عَنِ <a href="inr://man-5159">الْقَاسِمِ، </a>عَنْ <a href="inr://man-3026">عَائِشَةَ </a>﵂، عَنِ النَّبِيِّ ﷺ قَالَ: <hadeeth-2359>«مَنْ نَذَرَ أَنْ يُطِيعَ اللهَ فَلْيُطِعْهُ، وَمَنْ نَذَرَ أَنْ يَعْصِيَهُ فَلَا يَعْصِهِ.» <hadeeth>',
            });
        });

        it('should segment hadith content with HTML and preserve structure across pages', () => {
            // Two pages with hadiths, second hadith spans both pages
            const pages: PageInput[] = [
                {
                    content:
                        '١ - حَدَّثَنَا <a href="inr://man-123">فُلَانٌ</a> قَالَ: الحديث الأول\r٢ - حَدَّثَنَا <a href="inr://man-456">عِلَّانٌ</a>',
                    id: 100,
                    page: 1,
                    part: '1',
                },
                { content: 'تَابِعٌ لِلْحَدِيثِ <hadeeth-1>الثَّانِي<hadeeth>\r٣ - الحديث الثالث', id: 101, page: 2, part: '1' },
            ];

            const slices: SlicingOption[] = [{ regex: '^[٠-٩]+ - ' }];

            const result = segmentPages(pages, { slices, stripHtml: true });

            expect(result).toHaveLength(3);

            // First hadith - single page, HTML stripped
            expect(result[0]).toMatchObject({
                content: '١ - حَدَّثَنَا فُلَانٌ قَالَ: الحديث الأول',
                from: 100,
                html: '١ - حَدَّثَنَا <a href="inr://man-123">فُلَانٌ</a> قَالَ: الحديث الأول',
            });

            // Second hadith - spans pages, space-joined, HTML stripped
            expect(result[1]).toMatchObject({
                content: '٢ - حَدَّثَنَا عِلَّانٌ تَابِعٌ لِلْحَدِيثِ الثَّانِي',
                from: 100,
                html: '٢ - حَدَّثَنَا <a href="inr://man-456">عِلَّانٌ</a> تَابِعٌ لِلْحَدِيثِ <hadeeth-1>الثَّانِي<hadeeth>',
                to: 101,
            });

            // Third hadith - single page, no HTML
            expect(result[2]).toMatchObject({ content: '٣ - الحديث الثالث', from: 101 });
        });

        it('should only apply pattern when page is >= min', () => {
            const pages: PageInput[] = [
                { content: '١ - الحديث الأول', id: 100, page: 1, part: '1' },
                { content: '٢ - الحديث الثاني', id: 101, page: 5, part: '1' },
                { content: '٣ - الحديث الثالث', id: 102, page: 10, part: '1' },
            ];

            const slices: SlicingOption[] = [
                // Only match on pages >= 5
                { min: 5, regex: '^[٠-٩]+ - ' },
            ];

            const result = segmentPages(pages, { slices });

            // Page 1 should be skipped (below min)
            // Pages 5 and 10 should be segmented
            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ content: '٢ - الحديث الثاني', from: 101 });
            expect(result[1]).toMatchObject({ content: '٣ - الحديث الثالث', from: 102 });
        });

        it('should only apply pattern when page is <= max', () => {
            const pages: PageInput[] = [
                { content: '١ - الحديث الأول', id: 100, page: 1, part: '1' },
                { content: '٢ - الحديث الثاني', id: 101, page: 5, part: '1' },
                { content: '٣ - الحديث الثالث', id: 102, page: 10, part: '1' },
            ];

            const slices: SlicingOption[] = [
                // Only match on pages <= 5
                { max: 5, regex: '^[٠-٩]+ - ' },
            ];

            const result = segmentPages(pages, { slices });

            // Pages 1 and 5 should start segments
            // Page 10 content (above max) appends to previous segment
            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ content: '١ - الحديث الأول', from: 100 });
            // Segment 2 includes page 5 content + page 10 appended
            expect(result[1]).toMatchObject({ content: '٢ - الحديث الثاني ٣ - الحديث الثالث', from: 101, to: 102 });
        });

        it('should apply pattern only within min-max range', () => {
            const pages: PageInput[] = [
                { content: '١ - الحديث الأول', id: 100, page: 1, part: '1' },
                { content: '٢ - الحديث الثاني', id: 101, page: 5, part: '1' },
                { content: '٣ - الحديث الثالث', id: 102, page: 10, part: '1' },
                { content: '٤ - الحديث الرابع', id: 103, page: 15, part: '1' },
            ];

            const slices: SlicingOption[] = [
                // Only match on pages 5-10 (inclusive)
                { max: 10, min: 5, regex: '^[٠-٩]+ - ' },
            ];

            const result = segmentPages(pages, { slices });

            // Page 1 is dropped (before min, no previous segment to append to)
            // Pages 5 and 10 start segments
            // Page 15 content (above max) appends to segment starting at page 10
            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ content: '٢ - الحديث الثاني', from: 101 });
            expect(result[1]).toMatchObject({ content: '٣ - الحديث الثالث ٤ - الحديث الرابع', from: 102, to: 103 });
        });

        it('should expand {{raqms}} token in template patterns', () => {
            const pages: PageInput[] = [
                { content: '١ - الحديث الأول', id: 100, page: 1, part: '1' },
                { content: '٢ - الحديث الثاني', id: 101, page: 2, part: '1' },
            ];

            // Using {{raqms}} token in template field (expands to [٠-٩]+)
            const slices: SlicingOption[] = [{ template: '^{{raqms}} - ' }];

            const result = segmentPages(pages, { slices });

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ content: '١ - الحديث الأول', from: 100 });
            expect(result[1]).toMatchObject({ content: '٢ - الحديث الثاني', from: 101 });
        });

        it('should expand {{dash}} token in template patterns', () => {
            const pages: PageInput[] = [
                { content: '١ – الحديث الأول', id: 100, page: 1, part: '1' }, // en-dash
                { content: '٢ — الحديث الثاني', id: 101, page: 2, part: '1' }, // em-dash
            ];

            // Using {{dash}} token to match any dash variant
            const slices: SlicingOption[] = [{ template: '^{{raqms}} {{dash}} ' }];

            const result = segmentPages(pages, { slices });

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ content: '١ – الحديث الأول', from: 100 });
            expect(result[1]).toMatchObject({ content: '٢ — الحديث الثاني', from: 101 });
        });

        it('should expand {{title}} token in template patterns', () => {
            const pages: PageInput[] = [
                { content: '<span data-type="title" id=toc-1>باب الأول</span>\nنص الباب', id: 100, page: 1, part: '1' },
            ];

            // Using {{title}} token to match Shamela span tags
            const slices: SlicingOption[] = [{ template: '^{{title}}' }];

            const result = segmentPages(pages, { slices });

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                content: '<span data-type="title" id=toc-1>باب الأول</span>\nنص الباب',
                from: 100,
            });
        });

        it('should support template field with token expansion', () => {
            const pages: PageInput[] = [
                { content: '١ - الحديث الأول', id: 100, page: 1, part: '1' },
                { content: '٢ - الحديث الثاني', id: 101, page: 2, part: '1' },
            ];

            // Using template field instead of regex
            const slices: SlicingOption[] = [{ template: '^{{raqms}} {{dash}} ' }];

            const result = segmentPages(pages, { slices });

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ content: '١ - الحديث الأول', from: 100 });
            expect(result[1]).toMatchObject({ content: '٢ - الحديث الثاني', from: 101 });
        });
    });
});
