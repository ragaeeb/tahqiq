import { nowInSeconds } from './time';

/**
 * Updates an item in an array by its ID, applying partial updates.
 * Mutates the original array for Immer compatibility.
 *
 * @param items - Array of items with 'id' property
 * @param id - ID of the item to update
 * @param updates - Partial updates to apply
 * @param timestampField - Optional field name to set with current timestamp in seconds
 * @returns true if item was found and updated, false otherwise
 */
export function updateItemById<T extends { id: string | number }>(
    items: T[],
    id: T['id'],
    updates: Partial<Omit<T, 'id'>>,
    timestampField?: keyof T,
): boolean {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
        return false;
    }

    const timestampUpdate = timestampField ? { [timestampField]: nowInSeconds() } : {};
    items[index] = { ...items[index], ...updates, ...timestampUpdate };
    return true;
}

/**
 * Filters an array to remove items with IDs in the provided list.
 * Returns a new array without mutating the original.
 *
 * @param items - Array of items with 'id' property
 * @param ids - Array of IDs to remove
 * @returns New array with matching items removed
 */
export function deleteItemsByIds<T extends { id: string | number }>(items: T[], ids: T['id'][]): T[] {
    const idSet = new Set(ids);
    return items.filter((item) => !idSet.has(item.id));
}

/**
 * Applies a formatting function to a specific field on all items in an array.
 * Only updates items where the value actually changes.
 * Returns a new array without mutating the original.
 *
 * @param items - Array of items
 * @param field - Field name to apply formatting to
 * @param formatFn - Function that transforms the field value
 * @param timestampField - Optional field name to set with current timestamp when value changes
 * @returns New array with formatted values
 */
export function applyBulkFieldFormatting<T extends Record<string, any>>(
    items: T[],
    field: keyof T,
    formatFn: (value: string) => string,
    timestampField?: keyof T,
): T[] {
    const now = nowInSeconds();
    return items.map((item) => {
        const value = item[field];
        if (typeof value !== 'string') {
            return item;
        }

        const formatted = formatFn(value);
        if (formatted === value) {
            return item;
        }

        const timestampUpdate = timestampField ? { [timestampField]: now } : {};
        return { ...item, [field]: formatted, ...timestampUpdate };
    });
}

/**
 * Builds a Map of ID → array index for O(1) lookups.
 * Useful for bulk operations that need to find items by ID efficiently.
 *
 * @param items - Array of items with 'id' property
 * @returns Map from ID to array index
 */
export function buildIdIndexMap<T extends { id: string | number }>(items: T[]): Map<T['id'], number> {
    const map = new Map<T['id'], number>();
    for (let i = 0; i < items.length; i++) {
        map.set(items[i].id, i);
    }
    return map;
}
