let ID_COUNTER = 0;

export const getNextId = () => ++ID_COUNTER;

/**
 * Compares two objects and returns only the fields that have changed.
 * Handles type coercion for form data (strings to numbers) and JSON comparison for objects.
 *
 * @param original - The original object to compare against
 * @param updated - The updated values (typically from form data)
 * @param options - Configuration options
 * @returns Object containing only the changed fields, or empty object if no changes
 */
const normalizeValue = (key: string, value: unknown, numberFields: string[]) => {
    let normalized = value;
    if (numberFields.includes(key) && typeof normalized === 'string') {
        const trimmed = normalized.trim();
        normalized = trimmed === '' ? undefined : Number.parseInt(trimmed, 10) || undefined;
    }
    return normalized === '' ? undefined : normalized;
};

export function createObjectDiff<T extends Record<string, unknown>>(
    original: T,
    updated: Record<string, unknown>,
    options: { excludeKeys?: string[]; numberFields?: string[] } = {},
): Partial<T> {
    const { excludeKeys = [], numberFields = [] } = options;
    const diff: Record<string, unknown> = {};

    for (const key of Object.keys(updated)) {
        if (excludeKeys.includes(key)) {
            continue;
        }

        const originalValue = original[key];
        const updatedValue = normalizeValue(key, updated[key], numberFields);

        const isObject = typeof originalValue === 'object' && originalValue !== null;
        const changed = isObject
            ? JSON.stringify(originalValue) !== (updatedValue ? JSON.stringify(updatedValue) : '')
            : originalValue !== updatedValue;

        if (changed) {
            diff[key] = updatedValue;
        }
    }

    return diff as Partial<T>;
}

export const createUpdate = <T extends { from: number; to?: number }>(value: string, data: T) => {
    const parts = value.split('-').map((p) => Number.parseInt(p.trim(), 10));
    const newFrom = parts[0];
    if (Number.isNaN(newFrom)) {
        return undefined;
    }
    const newTo = parts.length > 1 ? parts[1] : undefined;

    const updates: { from?: number; to?: number } = {};

    if (!Number.isNaN(newFrom) && newFrom !== data.from) {
        updates.from = newFrom;
    }

    const toVal = !Number.isNaN(newTo as number) ? newTo : undefined;
    if (toVal !== data.to) {
        updates.to = toVal;
    }

    return Object.keys(updates).length > 0 ? updates : undefined;
};

/**
 * Creates a type-guarded filter predicate that checks for truthy values at the specified key.
 * Note: Filters out all falsy values (null, undefined, 0, '', false), not just null/undefined.
 */
export function filterByProperty<T, K extends keyof T>(key: K): (item: T) => item is T & Record<K, NonNullable<T[K]>> {
    return (item): item is T & Record<K, NonNullable<T[K]>> => {
        return !!item[key];
    };
}
