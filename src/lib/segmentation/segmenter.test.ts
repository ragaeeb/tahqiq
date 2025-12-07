import { describe, expect, it } from 'bun:test';

import { segmentPages } from './segmenter';
import type { PageInput, SplitRule } from './types';

describe('segmenter', () => {
    describe('segmentPages', () => {
        // ─────────────────────────────────────────────────────────────
        // Basic split: 'before' tests (current behavior)
        // ─────────────────────────────────────────────────────────────

        it('should segment a single plain-text page with 3 numeric markers', () => {
            const pages: PageInput[] = [{ content: '١ - الحديث الأول\r٢ - الحديث الثاني\r٣ - الحديث الثالث', id: 1 }];

            const rules: SplitRule[] = [{ regex: '^[٠-٩]+ - ', split: 'before' }];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(3);
            expect(result[0]).toMatchObject({ content: '١ - الحديث الأول', from: 1 });
            expect(result[1]).toMatchObject({ content: '٢ - الحديث الثاني', from: 1 });
            expect(result[2]).toMatchObject({ content: '٣ - الحديث الثالث', from: 1 });
        });

        it('should segment a single page with HTML title markers', () => {
            const pages: PageInput[] = [
                {
                    content:
                        '<span data-type="title" id=toc-1>باب الأول</span>\rنص الباب الأول\r<span data-type="title" id=toc-2>باب الثاني</span>\rنص الباب الثاني',
                    id: 5,
                },
            ];

            const rules: SplitRule[] = [{ regex: '^<span data-type="title"', split: 'before' }];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({
                content: '<span data-type="title" id=toc-1>باب الأول</span>\nنص الباب الأول',
                from: 5,
            });
            expect(result[1]).toMatchObject({
                content: '<span data-type="title" id=toc-2>باب الثاني</span>\nنص الباب الثاني',
                from: 5,
            });
        });

        it('should handle content spanning across 2 pages with space joining', () => {
            const pages: PageInput[] = [
                { content: '١ - الحديث الأول كامل\r٢ - بداية الحديث الثاني', id: 10 },
                { content: 'تكملة الحديث الثاني\r٣ - الحديث الثالث', id: 11 },
            ];

            const rules: SplitRule[] = [{ regex: '^[٠-٩]+ - ', split: 'before' }];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(3);
            expect(result[0]).toMatchObject({ content: '١ - الحديث الأول كامل', from: 10 });
            expect(result[1]).toMatchObject({
                content: '٢ - بداية الحديث الثاني تكملة الحديث الثاني',
                from: 10,
                to: 11,
            });
            expect(result[2]).toMatchObject({ content: '٣ - الحديث الثالث', from: 11 });
        });

        // ─────────────────────────────────────────────────────────────
        // Template and token expansion tests
        // ─────────────────────────────────────────────────────────────

        it('should expand {{raqms}} token in template patterns', () => {
            const pages: PageInput[] = [
                { content: '١ - الحديث الأول', id: 1 },
                { content: '٢ - الحديث الثاني', id: 2 },
            ];

            const rules: SplitRule[] = [{ split: 'before', template: '^{{raqms}} - ' }];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ content: '١ - الحديث الأول', from: 1 });
            expect(result[1]).toMatchObject({ content: '٢ - الحديث الثاني', from: 2 });
        });

        it('should expand {{dash}} token in template patterns', () => {
            const pages: PageInput[] = [
                { content: '١ – الحديث الأول', id: 1 }, // en-dash
                { content: '٢ — الحديث الثاني', id: 2 }, // em-dash
            ];

            const rules: SplitRule[] = [{ split: 'before', template: '^{{raqms}} {{dash}} ' }];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ content: '١ – الحديث الأول', from: 1 });
            expect(result[1]).toMatchObject({ content: '٢ — الحديث الثاني', from: 2 });
        });

        it('should expand {{title}} token in template patterns', () => {
            const pages: PageInput[] = [
                { content: '<span data-type="title" id=toc-1>باب الأول</span>\nنص الباب', id: 1 },
            ];

            const rules: SplitRule[] = [{ split: 'before', template: '^{{title}}' }];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                content: '<span data-type="title" id=toc-1>باب الأول</span>\nنص الباب',
                from: 1,
            });
        });

        // ─────────────────────────────────────────────────────────────
        // lineStartsWith syntax sugar tests
        // ─────────────────────────────────────────────────────────────

        it('should support lineStartsWith with multiple patterns', () => {
            const pages: PageInput[] = [
                { content: '<span data-type="title" id=toc-1>باب الأول</span>', id: 1 },
                { content: 'بَابُ الثاني', id: 2 },
                { content: '١ - الحديث الأول', id: 3 },
            ];

            const rules: SplitRule[] = [
                { lineStartsWith: ['{{title}}', 'بَابُ', '{{raqms}} - '], meta: { type: 'chapter' }, split: 'before' },
            ];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(3);
            expect(result[0]).toMatchObject({
                content: '<span data-type="title" id=toc-1>باب الأول</span>',
                from: 1,
                meta: { type: 'chapter' },
            });
            expect(result[1]).toMatchObject({ content: 'بَابُ الثاني', from: 2, meta: { type: 'chapter' } });
            expect(result[2]).toMatchObject({ content: '١ - الحديث الأول', from: 3, meta: { type: 'chapter' } });
        });

        // ─────────────────────────────────────────────────────────────
        // Page constraints (min/max) tests
        // ─────────────────────────────────────────────────────────────

        it('should only apply pattern when page is >= min', () => {
            const pages: PageInput[] = [
                { content: '١ - الحديث الأول', id: 1 },
                { content: '٢ - الحديث الثاني', id: 5 },
                { content: '٣ - الحديث الثالث', id: 10 },
            ];

            const rules: SplitRule[] = [{ min: 5, regex: '^[٠-٩]+ - ', split: 'before' }];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ content: '٢ - الحديث الثاني', from: 5 });
            expect(result[1]).toMatchObject({ content: '٣ - الحديث الثالث', from: 10 });
        });

        it('should only apply pattern when page is <= max', () => {
            const pages: PageInput[] = [
                { content: '١ - الحديث الأول', id: 1 },
                { content: '٢ - الحديث الثاني', id: 5 },
                { content: '٣ - الحديث الثالث', id: 10 },
            ];

            const rules: SplitRule[] = [{ max: 5, regex: '^[٠-٩]+ - ', split: 'before' }];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ content: '١ - الحديث الأول', from: 1 });
            expect(result[1]).toMatchObject({ content: '٢ - الحديث الثاني ٣ - الحديث الثالث', from: 5, to: 10 });
        });

        it('should apply pattern only within min-max range', () => {
            const pages: PageInput[] = [
                { content: '١ - الحديث الأول', id: 1 },
                { content: '٢ - الحديث الثاني', id: 5 },
                { content: '٣ - الحديث الثالث', id: 10 },
                { content: '٤ - الحديث الرابع', id: 15 },
            ];

            const rules: SplitRule[] = [{ max: 10, min: 5, regex: '^[٠-٩]+ - ', split: 'before' }];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ content: '٢ - الحديث الثاني', from: 5 });
            expect(result[1]).toMatchObject({ content: '٣ - الحديث الثالث ٤ - الحديث الرابع', from: 10, to: 15 });
        });

        // ─────────────────────────────────────────────────────────────
        // stripHtml tests
        // ─────────────────────────────────────────────────────────────

        it('should strip HTML for pattern matching when stripHtml option is true', () => {
            const pages: PageInput[] = [{ content: '٦٦٩٦ - حَدَّثَنَا <a href="inr://man-5093">أَبُو نُعَيْمٍ</a>', id: 142 }];

            const rules: SplitRule[] = [{ regex: '^[٠-٩]+ - ', split: 'before' }];

            const result = segmentPages(pages, { rules, stripHtml: true });

            expect(result).toHaveLength(1);
            // Content is stripped of HTML
            expect(result[0].content).toBe('٦٦٩٦ - حَدَّثَنَا أَبُو نُعَيْمٍ');
            expect(result[0].from).toBe(142);
        });

        // ─────────────────────────────────────────────────────────────
        // NEW: split: 'after' tests (end markers)
        // ─────────────────────────────────────────────────────────────

        it('should split after pattern when split is after', () => {
            const pages: PageInput[] = [
                { content: 'The quick brown fox jumps over the lazy dog', id: 1 },
                { content: 'This is another sentence about the quick brown fox jumping over the lazy dog', id: 2 },
            ];

            const rules: SplitRule[] = [{ regex: 'lazy', split: 'after' }];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(3);
            expect(result[0]).toMatchObject({ content: 'The quick brown fox jumps over the lazy', from: 1 });
            expect(result[1]).toMatchObject({
                content: ' dog This is another sentence about the quick brown fox jumping over the lazy',
                from: 1,
                to: 2,
            });
            expect(result[2]).toMatchObject({ content: ' dog', from: 2 });
        });

        it('should support lineEndsWith syntax sugar', () => {
            const pages: PageInput[] = [{ content: 'Line a\nLine b\nLine c1\nLine d', id: 1 }];

            // lineEndsWith: pattern at end of line
            const rules: SplitRule[] = [{ lineEndsWith: ['\\d+'], split: 'after' }];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ content: 'Line a\nLine b\nLine c1', from: 1 });
            expect(result[1]).toMatchObject({ content: '\nLine d', from: 1 });
        });

        // ─────────────────────────────────────────────────────────────
        // NEW: occurrence tests
        // ─────────────────────────────────────────────────────────────

        it('should only split at last occurrence when occurrence is last', () => {
            const pages: PageInput[] = [{ content: 'Sentence 1. Sentence 2. Sentence 3', id: 1 }];

            const rules: SplitRule[] = [{ occurrence: 'last', regex: '\\.\\s*', split: 'after' }];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(2);
            // Trailing whitespace is trimmed from segments
            expect(result[0]).toMatchObject({ content: 'Sentence 1. Sentence 2.', from: 1 });
            expect(result[1]).toMatchObject({ content: 'Sentence 3', from: 1 });
        });

        it('should only split at first occurrence when occurrence is first', () => {
            const pages: PageInput[] = [{ content: 'Hello. World. Foo.', id: 1 }];

            const rules: SplitRule[] = [{ occurrence: 'first', regex: '\\.', split: 'before' }];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ content: 'Hello', from: 1 });
            expect(result[1]).toMatchObject({ content: '. World. Foo.', from: 1 });
        });

        it('should split at all occurrences by default', () => {
            const pages: PageInput[] = [{ content: 'A.B.C.D', id: 1 }];

            const rules: SplitRule[] = [{ regex: '\\.', split: 'after' }];

            const result = segmentPages(pages, { rules });

            expect(result).toHaveLength(4);
            expect(result[0]).toMatchObject({ content: 'A.', from: 1 });
            expect(result[1]).toMatchObject({ content: 'B.', from: 1 });
            expect(result[2]).toMatchObject({ content: 'C.', from: 1 });
            expect(result[3]).toMatchObject({ content: 'D', from: 1 });
        });
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: maxSpan tests (page-group occurrence filtering)
    // ─────────────────────────────────────────────────────────────

    describe('maxSpan option', () => {
        // Test data: 4 entries with 0-indexed IDs (id 0, 1, 2, 3)
        const multiPageContent: PageInput[] = [
            { content: 'P1A. P1B. E1', id: 0 },
            { content: 'P2A. P2B. E2', id: 1 },
            { content: 'P3A. P3B. E3', id: 2 },
            { content: 'P4A. P4B. E4', id: 3 },
        ];

        it('should apply occurrence globally when maxSpan is undefined', () => {
            // occurrence: 'last' should find the LAST period across ALL pages (in page 4)
            const rules: SplitRule[] = [{ occurrence: 'last', regex: '\\.', split: 'after' }];

            const result = segmentPages(multiPageContent, { rules });

            // 1 split point (last period in entry 3) = 2 segments
            expect(result).toHaveLength(2);
            expect(result[0].from).toBe(0);
            expect(result[0].content).toContain('P1A');
            expect(result[0].content).toContain('P4B.');
            expect(result[1].content.trim()).toBe('E4');
        });

        it('should create split points per-page when maxSpan is 1', () => {
            // occurrence: 'last' with maxSpan: 1 creates one split point per page
            const rules: SplitRule[] = [{ maxSpan: 1, occurrence: 'last', regex: '\\.', split: 'after' }];

            const result = segmentPages(multiPageContent, { rules });

            // 4 entries = 4 split points = 5 segments
            expect(result.length).toBe(5);

            // First segment: from start to entry 0's last period
            expect(result[0].from).toBe(0);
            expect(result[0].content).toBe('P1A. P1B.');

            // Last segment: after entry 3's last period to end
            expect(result[result.length - 1].content.trim()).toBe('E4');
        });

        it('should create split points per 2-page group when maxSpan is 2', () => {
            // occurrence: 'last' with maxSpan: 2 creates one split per 2-page group
            const rules: SplitRule[] = [{ maxSpan: 2, occurrence: 'last', regex: '\\.', split: 'after' }];

            const result = segmentPages(multiPageContent, { rules });

            // 2 groups (id 0-1, id 2-3) = 2 split points = 3 segments
            expect(result.length).toBe(3);

            // First segment: from start to entry 1's last period
            expect(result[0].from).toBe(0);
            expect(result[0].content).toContain('P2B.');

            // Last segment: after entry 3's last period
            expect(result[result.length - 1].content.trim()).toBe('E4');
        });

        it('should treat maxSpan 0 as no grouping (entire content)', () => {
            // maxSpan: 0 should behave like undefined (no grouping)
            const rules: SplitRule[] = [{ maxSpan: 0, occurrence: 'last', regex: '\\.', split: 'after' }];

            const result = segmentPages(multiPageContent, { rules });

            // Same as undefined - 1 split = 2 segments
            expect(result).toHaveLength(2);
            expect(result[0].from).toBe(0);
            expect(result[1].content.trim()).toBe('E4');
        });

        it('should work with occurrence first and maxSpan 1', () => {
            // occurrence: 'first' with maxSpan: 1 finds FIRST period on EACH page
            const rules: SplitRule[] = [{ maxSpan: 1, occurrence: 'first', regex: '\\.', split: 'before' }];

            const result = segmentPages(multiPageContent, { rules });

            // 4 split points (first period each entry) = 5 segments
            expect(result.length).toBe(5);

            // First segment: from start to first period on entry 0
            expect(result[0].content).toBe('P1A');
            expect(result[0].from).toBe(0);
        });

        it('should combine maxSpan with min/max page constraints', () => {
            // Only apply to pages 2-3, with per-page occurrence
            const rules: SplitRule[] = [
                { max: 3, maxSpan: 1, min: 2, occurrence: 'last', regex: '\\.', split: 'after' },
            ];

            const result = segmentPages(multiPageContent, { rules });

            // IDs 2 and 3 each have split = 2 split points
            // Result: 2 segments
            expect(result.length).toBe(2);

            // First segment starts from id 2
            expect(result[0].from).toBe(2);
        });
    });
});
