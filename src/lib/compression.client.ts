'use client';

/**
 * Client-side Brotli compression using brotli-wasm.
 * This module is separated from the main compression module to avoid
 * Turbopack WASM loading issues during SSR/static page generation.
 */
export const compressOnClient = async (data: unknown) => {
    // Lazy-load brotli-wasm to avoid Turbopack WASM evaluation errors
    const brotli = await import('brotli-wasm').then((m) => m.default);

    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const originalSize = new Blob([jsonString]).size;
    const input = new TextEncoder().encode(jsonString);

    // Use named import directly
    const compressed = brotli.compress(input, { quality: 11 });
    // Create a new Uint8Array to ensure it has the correct ArrayBuffer type
    const compressedBlob = new Blob([new Uint8Array(compressed)], { type: 'application/octet-stream' });

    return { blob: compressedBlob, originalSize };
};
