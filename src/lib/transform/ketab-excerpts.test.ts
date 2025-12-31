import { describe, expect, test } from 'bun:test';
import type { Segment, SegmentationOptions } from 'flappa-doormal';
import { ketabSegmentsToExcerpts } from './ketab-excerpts';
import type { KetabPage, KetabTitle } from '@/stores/ketabStore/types';

describe('ketabSegmentsToExcerpts', () => {
    test('maps vol from part.name (numeric), not part.id', () => {
        const pages: KetabPage[] = [
            {
                body: 'ignored',
                id: 1,
                index: 0,
                page: 10,
                part: { id: 1555, name: '1' },
                quran: {},
                reciters: [],
                rowa: [],
                seal: '',
                shrooh: [],
            },
        ];

        const segments: Segment[] = [{ content: 'السلام عليكم', from: 1, meta: { type: 'chapter' } }];
        const titles: KetabTitle[] = [];
        const options = { rules: [], replace: [] } as unknown as SegmentationOptions;

        const excerpts = ketabSegmentsToExcerpts(pages, titles, segments, options);
        expect(excerpts.excerpts[0].vol).toBe(1);
        expect(excerpts.excerpts[0].vp).toBe(10);
    });

    test('parses part.name like "02" into vol=2', () => {
        const pages: KetabPage[] = [
            {
                body: 'ignored',
                id: 1,
                index: 0,
                page: 10,
                part: { id: 999, name: '02' },
                quran: {},
                reciters: [],
                rowa: [],
                seal: '',
                shrooh: [],
            },
        ];

        const segments: Segment[] = [{ content: 'الحمد لله', from: 1 }];
        const titles: KetabTitle[] = [];
        const options = { rules: [], replace: [] } as unknown as SegmentationOptions;

        const excerpts = ketabSegmentsToExcerpts(pages, titles, segments, options);
        expect(excerpts.excerpts[0].vol).toBe(2);
    });

    test('falls back to vol=0 when part is null or non-numeric', () => {
        const pages: KetabPage[] = [
            {
                body: 'ignored',
                id: 1,
                index: 0,
                page: 10,
                part: null,
                quran: {},
                reciters: [],
                rowa: [],
                seal: '',
                shrooh: [],
            },
            {
                body: 'ignored',
                id: 2,
                index: 1,
                page: 11,
                part: { id: 1555, name: 'X' },
                quran: {},
                reciters: [],
                rowa: [],
                seal: '',
                shrooh: [],
            },
        ];

        const segments: Segment[] = [
            { content: 'السلام عليكم', from: 1 },
            { content: 'السلام عليكم', from: 2 },
        ];
        const titles: KetabTitle[] = [];
        const options = { rules: [], replace: [] } as unknown as SegmentationOptions;

        const excerpts = ketabSegmentsToExcerpts(pages, titles, segments, options);
        expect(excerpts.excerpts[0].vol).toBe(0);
        expect(excerpts.excerpts[1].vol).toBe(0);
    });
});


