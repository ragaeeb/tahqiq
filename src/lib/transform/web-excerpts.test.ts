import { describe, expect, it } from 'bun:test';
import type { Segment, SegmentationOptions } from 'flappa-doormal';
import type { WebPage, WebTitle } from '@/stores/webStore/types';
import { webSegmentsToExcerpts } from './web-excerpts';

describe('web-excerpts', () => {
    describe('webSegmentsToExcerpts', () => {
        it('should convert segments to excerpts format', () => {
            const pages: WebPage[] = [
                { body: 'محتوى الصفحة الأولى', id: 1 },
                { body: 'محتوى الصفحة الثانية', id: 2 },
            ];
            const titles: WebTitle[] = [{ content: 'العنوان الأول', id: 1, page: 1 }];
            const segments: Segment[] = [
                { content: 'محتوى الجزء الأول', from: 1 },
                { content: 'محتوى الجزء الثاني', from: 2 },
            ];
            const options: SegmentationOptions = { rules: [] };

            const result = webSegmentsToExcerpts(pages, titles, segments, options);

            expect(result.excerpts).toHaveLength(2);
            expect(result.excerpts[0]?.id).toBe('P1');
            expect(result.excerpts[0]?.from).toBe(1);
            expect(result.excerpts[0]?.nass).toBeDefined();
            expect(result.excerpts[1]?.id).toBe('P2');
            expect(result.headings).toHaveLength(1);
            expect(result.headings[0]?.id).toBe('T1');
            expect(result.headings[0]?.nass).toBe('العنوان الأول');
        });

        it('should filter out segments with content too short after sanitization', () => {
            const pages: WebPage[] = [{ body: 'المحتوى', id: 1 }];
            const titles: WebTitle[] = [];
            const segments: Segment[] = [
                { content: 'AB', from: 1 }, // Too short
                { content: 'محتوى الجزء صالح وطويل بما فيه الكفاية', from: 1 },
            ];
            const options: SegmentationOptions = { rules: [] };

            const result = webSegmentsToExcerpts(pages, titles, segments, options);

            expect(result.excerpts).toHaveLength(1);
            expect(result.excerpts[0]?.id).toBe('P1');
        });

        it('should handle multiple segments from same page', () => {
            const pages: WebPage[] = [{ body: 'محتوى الصفحة', id: 1 }];
            const titles: WebTitle[] = [];
            const segments: Segment[] = [
                { content: 'الجزء الأول من الصفحة', from: 1 },
                { content: 'الجزء الثاني من الصفحة', from: 1 },
            ];
            const options: SegmentationOptions = { rules: [] };

            const result = webSegmentsToExcerpts(pages, titles, segments, options);

            expect(result.excerpts).toHaveLength(2);
            expect(result.excerpts[0]?.id).toBe('P1');
            expect(result.excerpts[1]?.id).toBe('P1a');
        });

        it('should handle segments with meta type book', () => {
            const pages: WebPage[] = [{ body: 'المحتوى', id: 1 }];
            const titles: WebTitle[] = [];
            const segments: Segment[] = [{ content: 'عنوان الكتاب الجديد', from: 1, meta: { type: 'book' } }];
            const options: SegmentationOptions = { rules: [] };

            const result = webSegmentsToExcerpts(pages, titles, segments, options);

            expect(result.excerpts[0]?.id).toBe('B1');
        });

        it('should handle segments with meta type chapter', () => {
            const pages: WebPage[] = [{ body: 'المحتوى', id: 1 }];
            const titles: WebTitle[] = [];
            const segments: Segment[] = [{ content: 'محتوى الباب الأول', from: 1, meta: { type: 'chapter' } }];
            const options: SegmentationOptions = { rules: [] };

            const result = webSegmentsToExcerpts(pages, titles, segments, options);

            expect(result.excerpts[0]?.id).toBe('C1');
        });

        it('should preserve segment meta in excerpts', () => {
            const pages: WebPage[] = [{ body: 'المحتوى', id: 1 }];
            const titles: WebTitle[] = [];
            const segments: Segment[] = [
                { content: 'جزء يحتوي على بيانات إضافية', from: 1, meta: { num: '123', type: 'hadith' } },
            ];
            const options: SegmentationOptions = { rules: [] };

            const result = webSegmentsToExcerpts(pages, titles, segments, options);

            expect(result.excerpts[0]?.meta?.num).toBe('123');
            expect(result.excerpts[0]?.meta?.type).toBe('hadith');
        });

        it('should set contractVersion and timestamps', () => {
            const pages: WebPage[] = [{ body: 'المحتوى', id: 1 }];
            const titles: WebTitle[] = [];
            const segments: Segment[] = [{ content: 'بعض محتوى الجزء', from: 1 }];
            const options: SegmentationOptions = { rules: [] };

            const result = webSegmentsToExcerpts(pages, titles, segments, options);

            expect(result.contractVersion).toBeDefined();
            expect(result.createdAt).toBeDefined();
            expect(result.lastUpdatedAt).toBeDefined();
            expect(result.options).toEqual(options);
        });

        it('should handle segment with to field', () => {
            const pages: WebPage[] = [
                { body: 'المحتوى ١', id: 1 },
                { body: 'المحتوى ٢', id: 2 },
            ];
            const titles: WebTitle[] = [];
            const segments: Segment[] = [{ content: 'محتوى يمتد عبر الصفحات', from: 1, to: 2 }];
            const options: SegmentationOptions = { rules: [] };

            const result = webSegmentsToExcerpts(pages, titles, segments, options);

            expect(result.excerpts[0]?.to).toBe(2);
        });
    });
});
