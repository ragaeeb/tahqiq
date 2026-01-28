import { brotliDecompressSync } from 'node:zlib';
import brotliPromise from 'brotli-wasm';

export const compressOnClient = async (data: unknown) => {
    const brotli = await brotliPromise;

    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const originalSize = new Blob([jsonString]).size;
    const input = new TextEncoder().encode(jsonString);

    // Use named import directly
    const compressed = brotli.compress(input, { quality: 11 });
    // Create a new Uint8Array to ensure it has the correct ArrayBuffer type
    const compressedBlob = new Blob([new Uint8Array(compressed)], { type: 'application/octet-stream' });

    return { blob: compressedBlob, originalSize };
};

/**
 * Decompresses a Brotli buffer into a UTF-8 string.
 */
export const decompressString = (buf: ArrayBuffer | Uint8Array) => {
    const out = brotliDecompressSync(buf);
    return out.toString('utf8');
};

/**
 * Decompresses a Brotli buffer and parses the JSON payload.
 */
export const decompressJson = <T = unknown>(buf: ArrayBuffer | Uint8Array) => {
    return JSON.parse(decompressString(buf)) as T;
};
