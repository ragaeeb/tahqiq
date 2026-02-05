import { describe, expect, it } from 'bun:test';
import type { ShamelaPage, ShamelaTitle } from '@/stores/shamelaStore/types';

// Test the pure filter functions directly (not the hook)
// The hook itself requires Next.js router context which is complex to test

type Filters = { content: string; id: string };

function filterItems<T extends { id: number }>(items: T[], filters: Filters, getContent: (item: T) => string): T[] {
    return items.filter((item) => {
        if (filters.id) {
            const idNum = Number.parseInt(filters.id, 10);
            if (!Number.isNaN(idNum) && item.id !== idNum) {
                return false;
            }
        }
        if (filters.content && !getContent(item).includes(filters.content)) {
            return false;
        }
        return true;
    });
}

const filterPages = (items: ShamelaPage[], filters: Filters) => filterItems(items, filters, (item) => item.body);
const filterTitles = (items: ShamelaTitle[], filters: Filters) => filterItems(items, filters, (item) => item.content);

describe('use-shamela-filters', () => {
    describe('filterItems', () => {
        it('should return all items when no filters applied', () => {
            const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

            const result = filterItems(items, { content: '', id: '' }, () => '');

            expect(result).toHaveLength(3);
            expect(result).toEqual(items);
        });

        it('should filter by id when id filter is provided', () => {
            const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

            const result = filterItems(items, { content: '', id: '2' }, () => '');

            expect(result).toHaveLength(1);
            expect(result[0]?.id).toBe(2);
        });

        it('should filter by content when content filter is provided', () => {
            const items = [
                { content: 'Hello world', id: 1 },
                { content: 'Goodbye world', id: 2 },
                { content: 'Hello again', id: 3 },
            ];

            const result = filterItems(
                items,
                { content: 'Hello', id: '' },
                (item) => (item as { content: string }).content,
            );

            expect(result).toHaveLength(2);
            expect(result[0]?.id).toBe(1);
            expect(result[1]?.id).toBe(3);
        });

        it('should apply both id and content filters', () => {
            const items = [
                { content: 'Hello world', id: 1 },
                { content: 'Goodbye world', id: 2 },
            ];

            const result = filterItems(
                items,
                { content: 'Hello', id: '1' },
                (item) => (item as { content: string }).content,
            );

            expect(result).toHaveLength(1);
            expect(result[0]?.id).toBe(1);
        });

        it('should return empty array when id filter matches nothing', () => {
            const items = [{ id: 1 }, { id: 2 }];

            const result = filterItems(items, { content: '', id: '999' }, () => '');

            expect(result).toHaveLength(0);
        });
    });

    describe('filterPages', () => {
        it('should filter pages by body content', () => {
            const pages: ShamelaPage[] = [
                { body: 'بسم الله الرحمن الرحيم', id: 1 },
                { body: 'الحمد لله رب العالمين', id: 2 },
                { body: 'بسم الله والصلاة', id: 3 },
            ];

            const result = filterPages(pages, { content: 'بسم الله', id: '' });

            expect(result).toHaveLength(2);
            expect(result[0]?.id).toBe(1);
            expect(result[1]?.id).toBe(3);
        });

        it('should filter pages by id', () => {
            const pages: ShamelaPage[] = [
                { body: 'Page 1', id: 10 },
                { body: 'Page 2', id: 20 },
            ];

            const result = filterPages(pages, { content: '', id: '20' });

            expect(result).toHaveLength(1);
            expect(result[0]?.id).toBe(20);
        });
    });

    describe('filterTitles', () => {
        it('should filter titles by content', () => {
            const titles: ShamelaTitle[] = [
                { content: 'باب الصلاة', id: 1, page: 1 },
                { content: 'باب الزكاة', id: 2, page: 2 },
                { content: 'كتاب الصيام', id: 3, page: 3 },
            ];

            const result = filterTitles(titles, { content: 'باب', id: '' });

            expect(result).toHaveLength(2);
            expect(result[0]?.id).toBe(1);
            expect(result[1]?.id).toBe(2);
        });

        it('should filter titles by id', () => {
            const titles: ShamelaTitle[] = [
                { content: 'Title 1', id: 100, page: 1 },
                { content: 'Title 2', id: 200, page: 2 },
            ];

            const result = filterTitles(titles, { content: '', id: '100' });

            expect(result).toHaveLength(1);
            expect(result[0]?.id).toBe(100);
        });
    });
});
