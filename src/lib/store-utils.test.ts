import { describe, expect, it } from 'bun:test';

import { applyBulkFieldFormatting, buildIdIndexMap, deleteItemsByIds, updateItemById } from './store-utils';

describe('store-utils', () => {
    describe('updateItemById', () => {
        it('should update an existing item by string ID', () => {
            const items = [
                { age: 30, id: 'A1', name: 'Alice' },
                { age: 25, id: 'A2', name: 'Bob' },
            ];

            const result = updateItemById(items, 'A1', { name: 'Alicia' });

            expect(result).toBe(true);
            expect(items[0]?.name).toBe('Alicia');
            expect(items[0]?.age).toBe(30); // Unchanged field preserved
        });

        it('should update an existing item by numeric ID', () => {
            const items = [
                { id: 1, value: 'first' },
                { id: 2, value: 'second' },
            ];

            const result = updateItemById(items, 2, { value: 'updated' });

            expect(result).toBe(true);
            expect(items[1]?.value).toBe('updated');
        });

        it('should return false and not modify array when ID not found', () => {
            const items = [{ id: 'A1', name: 'Alice' }];
            const originalItem = { ...items[0] };

            const result = updateItemById(items, 'nonexistent', { name: 'Bob' });

            expect(result).toBe(false);
            expect(items[0]).toEqual(originalItem);
        });

        it('should set timestamp field if provided', () => {
            const items = [{ id: 'A1', lastUpdatedAt: 0, name: 'Alice' }];

            updateItemById(items, 'A1', { name: 'Alicia' }, 'lastUpdatedAt');

            expect(items[0]?.lastUpdatedAt).toBeGreaterThan(0);
        });

        it('should handle empty array', () => {
            const items: { id: string; name: string }[] = [];

            const result = updateItemById(items, 'A1', { name: 'Bob' });

            expect(result).toBe(false);
            expect(items).toHaveLength(0);
        });
    });

    describe('deleteItemsByIds', () => {
        it('should delete items with matching string IDs', () => {
            const items = [
                { id: 'A1', name: 'Alice' },
                { id: 'A2', name: 'Bob' },
                { id: 'A3', name: 'Charlie' },
            ];

            const result = deleteItemsByIds(items, ['A1', 'A3']);

            expect(result).toHaveLength(1);
            expect(result[0]?.id).toBe('A2');
        });

        it('should delete items with matching numeric IDs', () => {
            const items = [
                { id: 1, value: 'one' },
                { id: 2, value: 'two' },
                { id: 3, value: 'three' },
            ];

            const result = deleteItemsByIds(items, [2]);

            expect(result).toHaveLength(2);
            expect(result.map((i) => i.id)).toEqual([1, 3]);
        });

        it('should return all items when no IDs match', () => {
            const items = [
                { id: 'A1', name: 'Alice' },
                { id: 'A2', name: 'Bob' },
            ];

            const result = deleteItemsByIds(items, ['nonexistent']);

            expect(result).toHaveLength(2);
        });

        it('should return empty array when all items deleted', () => {
            const items = [{ id: 'A1', name: 'Alice' }];

            const result = deleteItemsByIds(items, ['A1']);

            expect(result).toHaveLength(0);
        });

        it('should handle empty items array', () => {
            const items: { id: string }[] = [];

            const result = deleteItemsByIds(items, ['A1']);

            expect(result).toHaveLength(0);
        });

        it('should handle empty IDs array', () => {
            const items = [{ id: 'A1', name: 'Alice' }];

            const result = deleteItemsByIds(items, []);

            expect(result).toHaveLength(1);
        });
    });

    describe('applyBulkFieldFormatting', () => {
        it('should apply formatting function to specified field', () => {
            const items = [
                { id: 'A1', text: 'hello' },
                { id: 'A2', text: 'world' },
            ];

            const result = applyBulkFieldFormatting(items, 'text', (t) => t.toUpperCase());

            expect(result[0]?.text).toBe('HELLO');
            expect(result[1]?.text).toBe('WORLD');
        });

        it('should skip items where field value is not a string', () => {
            const items = [
                { id: 'A1', value: 'text' },
                { id: 'A2', value: 123 as any },
                { id: 'A3', value: null as any },
            ];

            const result = applyBulkFieldFormatting(items, 'value', (t) => t.toUpperCase());

            expect(result[0]?.value).toBe('TEXT');
            expect(result[1]?.value).toBe(123);
            expect(result[2]?.value).toBe(null);
        });

        it('should skip items where formatting produces same value', () => {
            const items = [
                { id: 'A1', lastUpdatedAt: 1000, text: 'HELLO' },
                { id: 'A2', lastUpdatedAt: 1000, text: 'world' },
            ];

            const result = applyBulkFieldFormatting(items, 'text', (t) => t.toUpperCase(), 'lastUpdatedAt');

            // 'HELLO' unchanged - timestamp should remain 1000
            expect(result[0]?.lastUpdatedAt).toBe(1000);
            // 'world' changed to 'WORLD' - timestamp should be updated
            expect(result[1]?.lastUpdatedAt).toBeGreaterThan(1000);
        });

        it('should set timestamp field when value changes', () => {
            const items = [{ id: 'A1', text: 'hello', updated: 0 }];

            const result = applyBulkFieldFormatting(items, 'text', (t) => t.toUpperCase(), 'updated');

            expect(result[0]?.updated).toBeGreaterThan(0);
        });

        it('should handle empty array', () => {
            const items: { id: string; text: string }[] = [];

            const result = applyBulkFieldFormatting(items, 'text', (t) => t.toUpperCase());

            expect(result).toHaveLength(0);
        });

        it('should not mutate original array', () => {
            const items = [{ id: 'A1', text: 'hello' }];

            const result = applyBulkFieldFormatting(items, 'text', (t) => t.toUpperCase());

            expect(items[0]?.text).toBe('hello'); // Original unchanged
            expect(result[0]?.text).toBe('HELLO'); // New array has changes
        });
    });

    describe('buildIdIndexMap', () => {
        it('should build map from string IDs to indices', () => {
            const items = [
                { id: 'A1', name: 'Alice' },
                { id: 'A2', name: 'Bob' },
                { id: 'A3', name: 'Charlie' },
            ];

            const map = buildIdIndexMap(items);

            expect(map.get('A1')).toBe(0);
            expect(map.get('A2')).toBe(1);
            expect(map.get('A3')).toBe(2);
            expect(map.size).toBe(3);
        });

        it('should build map from numeric IDs to indices', () => {
            const items = [
                { id: 10, value: 'ten' },
                { id: 20, value: 'twenty' },
            ];

            const map = buildIdIndexMap(items);

            expect(map.get(10)).toBe(0);
            expect(map.get(20)).toBe(1);
        });

        it('should return undefined for non-existent IDs', () => {
            const items = [{ id: 'A1', name: 'Alice' }];

            const map = buildIdIndexMap(items);

            expect(map.get('nonexistent')).toBeUndefined();
        });

        it('should handle empty array', () => {
            const items: { id: string }[] = [];

            const map = buildIdIndexMap(items);

            expect(map.size).toBe(0);
        });

        it('should handle duplicate IDs (last one wins)', () => {
            const items = [
                { id: 'A1', value: 'first' },
                { id: 'A1', value: 'second' },
            ];

            const map = buildIdIndexMap(items);

            expect(map.get('A1')).toBe(1); // Last index wins
        });
    });
});
