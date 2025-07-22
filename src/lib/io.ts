/**
 * Loads and decompresses data from sessionStorage using native Compression Streams API.
 * The stored base64 string is decoded, decompressed using gzip,
 * and then JSON parsed to reconstruct the original object.
 *
 * @template T - The expected type of the decompressed data
 * @param key - The sessionStorage key to retrieve the compressed data from
 * @returns The decompressed and parsed object, or null if not found or on error
 */
export async function loadCompressed<T>(key: string): Promise<null | T> {
    try {
        const base64 = sessionStorage.getItem(key);
        if (!base64) return null;

        // Convert base64 to Uint8Array without using spread operator
        const compressedData = base64ToArrayBuffer(base64);

        const ds = new DecompressionStream('gzip');
        const stream = new Response(compressedData).body?.pipeThrough(ds);
        const jsonString = await new Response(stream).text();

        return JSON.parse(jsonString) as T;
    } catch (error) {
        console.error('Error loading compressed data:', error);
        return null;
    }
}

/**
 * Compresses an object and saves it to sessionStorage using native Compression Streams API.
 * The object is first JSON stringified, then compressed using gzip,
 * and finally encoded as base64 for storage.
 *
 * @template T - The type of the data to compress and save
 * @param key - The sessionStorage key to use for storing the compressed data
 * @param data - The data object to compress and save
 * @throws {Error} When JSON stringification, compression, or storage fails
 */
export async function saveCompressed<T>(key: string, data: T): Promise<void> {
    try {
        const jsonString = JSON.stringify(data);

        const cs = new CompressionStream('gzip');
        const stream = new Response(jsonString).body?.pipeThrough(cs);
        const compressedData = await new Response(stream).arrayBuffer();

        // Convert ArrayBuffer to base64 without using spread operator
        const uint8Array = new Uint8Array(compressedData);
        const base64 = arrayBufferToBase64(uint8Array);

        sessionStorage.setItem(key, base64);
    } catch (error) {
        console.error('Error saving compressed data:', error);
        throw error;
    }
}

/**
 * Converts a Uint8Array to base64 string without using spread operator
 * to avoid call stack overflow on large arrays.
 */
function arrayBufferToBase64(uint8Array: Uint8Array): string {
    let binaryString = '';
    const chunkSize = 8192; // Process in chunks to avoid call stack issues

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }

    return btoa(binaryString);
}

/**
 * Converts a base64 string to Uint8Array without using spread operator
 * to avoid call stack overflow on large arrays.
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
}
