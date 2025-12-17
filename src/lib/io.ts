/**
 * Storage utilities using Origin Private File System (OPFS).
 * OPFS provides much larger storage capacity than sessionStorage/localStorage
 * without requiring user permissions.
 */

/**
 * Loads data from OPFS.
 * The stored JSON file is read and parsed to reconstruct the original object.
 *
 * @template T - The expected type of the stored data
 * @param key - The storage key (used as filename)
 * @returns The parsed object, or null if not found or on error
 */
export async function loadCompressed<T>(key: string): Promise<null | T> {
    try {
        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle(`${key}.json`);
        const file = await fileHandle.getFile();
        const text = await file.text();
        return JSON.parse(text) as T;
    } catch (error) {
        // File doesn't exist or other error - return null
        if (error instanceof DOMException && error.name === 'NotFoundError') {
            return null;
        }
        console.error('Error loading from OPFS:', error);
        return null;
    }
}

/**
 * Saves data to OPFS.
 * The object is JSON stringified and stored as a file.
 *
 * @template T - The type of the data to save
 * @param key - The storage key (used as filename)
 * @param data - The data object to save
 * @throws {Error} When storage fails
 */
export async function saveCompressed<T>(key: string, data: T): Promise<void> {
    try {
        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle(`${key}.json`, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data));
        await writable.close();
    } catch (error) {
        console.error('Error saving to OPFS:', error);
        throw error;
    }
}

/**
 * Clears a specific key from OPFS storage.
 *
 * @param key - The storage key to clear
 */
export async function clearStorage(key: string): Promise<void> {
    try {
        const root = await navigator.storage.getDirectory();
        await root.removeEntry(`${key}.json`);
    } catch (error) {
        // Ignore if file doesn't exist
        if (!(error instanceof DOMException && error.name === 'NotFoundError')) {
            console.error('Error clearing OPFS storage:', error);
        }
    }
}

/**
 * Clears all OPFS storage for this origin.
 */
export async function clearAllStorage(): Promise<void> {
    try {
        const root = await navigator.storage.getDirectory();
        for await (const name of (root as any).keys()) {
            await root.removeEntry(name);
        }
    } catch (error) {
        console.error('Error clearing all OPFS storage:', error);
    }
}

export const loadFiles = async (files: FileList) => {
    const fileNameToData: Record<string, any> = {};

    for (const file of files) {
        const data = await file.text();
        fileNameToData[file.name] = file.name.endsWith('.json') ? JSON.parse(data) : data;
    }

    return fileNameToData;
};
