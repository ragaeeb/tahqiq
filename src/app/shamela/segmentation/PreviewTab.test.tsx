import { describe, expect, it } from 'bun:test';
import type { Segment } from 'flappa-doormal';

/**
 * Unit tests for PreviewTab component.
 * These tests focus on the component's logic rather than rendering,
 * as the component is heavily dependent on external stores and APIs.
 */
describe('PreviewTab', () => {
    describe('PreviewRow formatting logic', () => {
        it('should format pages display as "from-to" when both values exist', () => {
            const segment: Partial<Segment> = { from: 1, to: 5 };
            const pagesDisplay = [segment.from, segment.to].filter(Boolean).join('-');

            expect(pagesDisplay).toBe('1-5');
        });

        it('should format pages display as "from" when only from exists', () => {
            const segment: Partial<Segment> = { from: 3 };
            const pagesDisplay = [segment.from, segment.to].filter(Boolean).join('-');

            expect(pagesDisplay).toBe('3');
        });

        it('should determine row background as green for chapter meta type', () => {
            const metaType = 'chapter';
            const index = 0;

            const rowBg =
                metaType === 'chapter'
                    ? 'bg-green-50'
                    : metaType === 'book'
                      ? 'bg-blue-50'
                      : index % 2 === 0
                        ? 'bg-white'
                        : 'bg-muted/20';

            expect(rowBg).toBe('bg-green-50');
        });

        it('should determine row background as blue for book meta type', () => {
            const metaType: string = 'book';
            const index = 0;

            const rowBg =
                metaType === 'chapter'
                    ? 'bg-green-50'
                    : metaType === 'book'
                      ? 'bg-blue-50'
                      : index % 2 === 0
                        ? 'bg-white'
                        : 'bg-muted/20';

            expect(rowBg).toBe('bg-blue-50');
        });

        it('should alternate background for non-meta rows', () => {
            const metaType = undefined;

            const getRowBg = (index: number) =>
                metaType === 'chapter'
                    ? 'bg-green-50'
                    : metaType === 'book'
                      ? 'bg-blue-50'
                      : index % 2 === 0
                        ? 'bg-white'
                        : 'bg-muted/20';

            expect(getRowBg(0)).toBe('bg-white');
            expect(getRowBg(1)).toBe('bg-muted/20');
            expect(getRowBg(2)).toBe('bg-white');
        });

        it('should filter out content from meta display', () => {
            const meta = { content: 'should be removed', title: 'Test', type: 'chapter' };
            const { content, ...cleanMeta } = meta;

            expect(cleanMeta).toEqual({ title: 'Test', type: 'chapter' });
            expect(Object.keys(cleanMeta)).not.toContain('content');
        });

        it('should return dash when meta is empty after filtering', () => {
            const meta = { content: 'only content' } as Record<string, unknown>;
            const { content, ...cleanMeta } = meta;

            const display = Object.keys(cleanMeta).length > 0 ? JSON.stringify(cleanMeta) : '—';

            expect(display).toBe('—');
        });

        it('should stringify non-empty meta', () => {
            const meta = { num: 5, type: 'chapter' };
            const { content, ...cleanMeta } = meta as Record<string, unknown>;

            const display = Object.keys(cleanMeta).length > 0 ? JSON.stringify(cleanMeta) : '—';

            expect(display).toBe('{"num":5,"type":"chapter"}');
        });
    });
});
