import { describe, expect, it } from 'bun:test';
import { createMatcher } from '@/lib/search';

// Replicating the filterItems function from use-excerpt-filters.ts for testing
type Filters = { nass: string; page: string; text: string };

function filterItems<T extends { from: number; nass: string; text: string }>(items: T[], filters: Filters): T[] {
    return items.filter((item) => {
        if (filters.page) {
            const pageNum = Number.parseInt(filters.page, 10);
            if (!Number.isNaN(pageNum) && item.from !== pageNum) {
                return false;
            }
        }
        if (filters.nass && !createMatcher(filters.nass)(item.nass)) {
            return false;
        }
        if (filters.text && !createMatcher(filters.text)(item.text)) {
            return false;
        }
        return true;
    });
}

describe('use-excerpt-filters', () => {
    describe('filterItems', () => {
        const mockItems = [
            { from: 1, id: 'E1', nass: 'بسم الله الرحمن الرحيم', text: 'In the name of Allah' },
            { from: 2, id: 'E2', nass: 'الحمد لله رب العالمين', text: 'Praise be to Allah' },
            { from: 3, id: 'E3', nass: 'الرحمن الرحيم', text: 'The Most Gracious' },
            { from: 1, id: 'E4', nass: 'مالك يوم الدين', text: 'Master of the Day' },
        ];

        it('should return all items when no filters applied', () => {
            const result = filterItems(mockItems, { nass: '', page: '', text: '' });

            expect(result).toHaveLength(4);
            expect(result).toEqual(mockItems);
        });

        it('should filter by page number', () => {
            const result = filterItems(mockItems, { nass: '', page: '1', text: '' });

            expect(result).toHaveLength(2);
            expect(result[0]?.id).toBe('E1');
            expect(result[1]?.id).toBe('E4');
        });

        it('should filter by nass content', () => {
            const result = filterItems(mockItems, { nass: 'الرحمن', page: '', text: '' });

            expect(result).toHaveLength(2);
            expect(result[0]?.id).toBe('E1');
            expect(result[1]?.id).toBe('E3');
        });

        it('should filter by text content', () => {
            const result = filterItems(mockItems, { nass: '', page: '', text: 'Allah' });

            expect(result).toHaveLength(2);
            expect(result[0]?.id).toBe('E1');
            expect(result[1]?.id).toBe('E2');
        });

        it('should apply multiple filters simultaneously', () => {
            const result = filterItems(mockItems, { nass: 'الرحمن', page: '1', text: '' });

            expect(result).toHaveLength(1);
            expect(result[0]?.id).toBe('E1');
        });

        it('should return empty array when no items match', () => {
            const result = filterItems(mockItems, { nass: 'nonexistent', page: '', text: '' });

            expect(result).toHaveLength(0);
        });

        it('should handle invalid page number gracefully', () => {
            const result = filterItems(mockItems, { nass: '', page: 'invalid', text: '' });

            // Invalid page number should not filter (NaN comparison fails)
            expect(result).toHaveLength(4);
        });
    });
});
