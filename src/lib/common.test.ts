import { describe, expect, it } from 'bun:test';
import { createObjectDiff, createUpdate, filterByProperty } from './common';

describe('createUpdate', () => {
    it('should return undefined if no changes', () => {
        const data = { from: 1, to: 5 };
        const result = createUpdate('1-5', data);
        expect(result).toBeUndefined();
    });

    it('should return update if from changes', () => {
        const data = { from: 1, to: 5 };
        const result = createUpdate('2-5', data);
        expect(result).toEqual({ from: 2 });
    });

    it('should return update if to changes', () => {
        const data = { from: 1, to: 5 };
        const result = createUpdate('1-6', data);
        expect(result).toEqual({ to: 6 });
    });

    it('should handle single page (to=undefined)', () => {
        const data = { from: 1, to: 5 };
        const result = createUpdate('1', data);
        expect(result).toEqual({ to: undefined });
    });

    it('should handle undefined to becoming defined', () => {
        const data = { from: 1, to: undefined };
        const result = createUpdate('1-5', data);
        expect(result).toEqual({ to: 5 });
    });

    it('should ignore invalid numbers', () => {
        const data = { from: 1, to: 5 };
        const result = createUpdate('foo-bar', data);
        // Both fail to parse, so no change detected against existing numbers?
        // Wait, checked implementation: if !Number.isNaN(newFrom) && newFrom !== data.from
        expect(result).toBeUndefined();
    });

    it('should handle whitespace', () => {
        const data = { from: 1, to: 5 };
        const result = createUpdate(' 2 - 6 ', data);
        expect(result).toEqual({ from: 2, to: 6 });
    });
});

describe('createObjectDiff', () => {
    it('should return empty object when no changes', () => {
        const original = { name: 'test', value: 42 };
        const updated = { name: 'test', value: 42 };

        const diff = createObjectDiff(original, updated);

        expect(diff).toEqual({});
    });

    it('should detect string changes', () => {
        const original = { name: 'old', text: 'hello' };
        const updated = { name: 'new', text: 'hello' };

        const diff = createObjectDiff(original, updated);

        expect(diff).toEqual({ name: 'new' });
    });

    it('should detect number changes', () => {
        const original = { count: 10, size: 5 };
        const updated = { count: 20, size: 5 };

        const diff = createObjectDiff(original, updated);

        expect(diff).toEqual({ count: 20 });
    });

    it('should parse string to number for numberFields', () => {
        const original = { from: 10, to: 20 };
        const updated = { from: '15', to: '20' };

        const diff = createObjectDiff(original, updated, { numberFields: ['from', 'to'] });

        expect(diff).toEqual({ from: 15 });
    });

    it('should handle empty string as undefined for numberFields', () => {
        const original = { from: 10, to: 20 };
        const updated = { from: '10', to: '' };

        const diff = createObjectDiff(original, updated, { numberFields: ['from', 'to'] });

        expect(diff).toEqual({ to: undefined });
    });

    it('should exclude specified keys', () => {
        const original = { id: '123', name: 'test', value: 1 };
        const updated = { id: '456', name: 'new', value: 1 };

        const diff = createObjectDiff(original, updated, { excludeKeys: ['id'] });

        expect(diff).toEqual({ name: 'new' });
    });

    it('should compare objects by JSON serialization', () => {
        const original = { meta: { num: '5', type: 'chapter' } };
        const updated = { meta: { num: '5', type: 'book' } };

        const diff = createObjectDiff(original, updated);

        expect(diff).toEqual({ meta: { num: '5', type: 'book' } });
    });

    it('should detect object to undefined change', () => {
        const original = { meta: { type: 'chapter' } };
        const updated = { meta: undefined };

        const diff = createObjectDiff(original, updated);

        expect(diff).toEqual({ meta: undefined });
    });

    it('should skip keys not present in updated', () => {
        const original = { extra: 'value', name: 'test' };
        const updated = { name: 'new' };

        const diff = createObjectDiff(original, updated);

        expect(diff).toEqual({ name: 'new' });
    });

    it('should normalize empty strings to undefined', () => {
        const original = { name: 'test', text: undefined };
        const updated = { name: '', text: '' };

        const diff = createObjectDiff(original, updated);

        expect(diff).toEqual({ name: undefined });
    });

    it('should handle undefined original value changing to new value', () => {
        const original: { name: string; text?: string } = { name: 'test', text: undefined };
        const updated = { name: 'test', text: 'new text' };

        const diff = createObjectDiff(original, updated);

        expect(diff).toEqual({ text: 'new text' });
    });

    it('should handle multiple changes at once', () => {
        const original = { from: 1, meta: { type: 'a' }, name: 'old', to: 10 };
        const updated = { from: '5', meta: { type: 'b' }, name: 'new', to: '10' };

        const diff = createObjectDiff(original, updated, { numberFields: ['from', 'to'] });

        expect(diff).toEqual({ from: 5, meta: { type: 'b' }, name: 'new' });
    });

    it('should detect new keys in updated that do not exist in original', () => {
        const original: Record<string, any> = { name: 'test' };
        const updated = { meta: { type: 'chapter' }, name: 'test', to: 10 };

        const diff = createObjectDiff(original, updated);

        expect(diff).toEqual({ meta: { type: 'chapter' }, to: 10 });
    });

    it('should handle adding meta when original has no meta property', () => {
        const original: Record<string, any> = { from: 1, nass: 'text' };
        const updated = { from: 1, meta: { type: 'book' }, nass: 'text' };

        const diff = createObjectDiff(original, updated);

        expect(diff).toEqual({ meta: { type: 'book' } });
    });
});

describe('filterByProperty', () => {
    it('should filter out items with falsy values for the property', () => {
        const items = [
            { id: 1, value: 'valid' },
            { id: 2, value: '' },
            { id: 3, value: null },
            { id: 4, value: undefined },
            { id: 5, value: 0 },
            { id: 6, value: false },
        ];

        const result = items.filter(filterByProperty('value'));
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ id: 1, value: 'valid' });
    });

    it('should correctly type-guard the filtered items', () => {
        type Item = { id: number; name?: string };
        const items: Item[] = [{ id: 1, name: 'Alice' }, { id: 2 }];

        const result = items.filter(filterByProperty('name'));

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Alice');
    });

    it('should work with different property types', () => {
        const items = [
            { count: 5, id: 1 },
            { count: 0, id: 2 },
            { count: -1, id: 3 },
        ];

        const result = items.filter(filterByProperty('count'));
        // 0 is falsy, so it should be filtered out
        expect(result).toHaveLength(2);
        expect(result.map((i) => i.id)).toEqual([1, 3]);
    });
});
