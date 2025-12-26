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
export function createObjectDiff<T extends Record<string, unknown>>(
    original: T,
    updated: Record<string, unknown>,
    options: {
        /** Fields to exclude from comparison (e.g., 'id', 'lastUpdatedAt') */
        excludeKeys?: string[];
        /** Fields that should be parsed as numbers */
        numberFields?: string[];
    } = {},
): Partial<T> {
    const { excludeKeys = [], numberFields = [] } = options;
    const diff: Record<string, unknown> = {};

    // Get all unique keys from both objects
    const allKeys = new Set([...Object.keys(original), ...Object.keys(updated)]);

    for (const key of allKeys) {
        if (excludeKeys.includes(key)) {
            continue;
        }

        const originalValue = original[key];
        let updatedValue = updated[key];

        // Skip if key doesn't exist in updated
        if (!(key in updated)) {
            continue;
        }

        // Handle number fields - parse string to number
        if (numberFields.includes(key) && typeof updatedValue === 'string') {
            const trimmed = updatedValue.trim();
            updatedValue = trimmed === '' ? undefined : Number.parseInt(trimmed, 10) || undefined;
        }

        // Normalize empty strings to undefined for comparison
        if (updatedValue === '') {
            updatedValue = undefined;
        }

        // Compare values
        if (typeof originalValue === 'object' && originalValue !== null) {
            // For objects (like meta), compare JSON strings
            const originalJson = JSON.stringify(originalValue);
            const updatedJson = updatedValue ? JSON.stringify(updatedValue) : '';
            if (originalJson !== updatedJson) {
                diff[key] = updatedValue;
            }
        } else if (originalValue !== updatedValue) {
            diff[key] = updatedValue;
        }
    }

    return diff as Partial<T>;
}
