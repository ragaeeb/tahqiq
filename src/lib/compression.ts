import { Readable } from 'node:stream';
import { brotliCompressSync, brotliDecompressSync, constants as zc } from 'node:zlib';

type CompressOpts = {
    /** Sort object keys recursively before stringify for slightly better compression (default: true). */
    canonical?: boolean;
};

const canonicalize = (v: unknown): unknown => {
    if (Array.isArray(v)) {
        return v.map(canonicalize);
    }
    if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(v as Record<string, unknown>).sort()) {
            out[k] = canonicalize((v as Record<string, unknown>)[k]);
        }
        return out;
    }
    return v; // primitives, dates (stringified), etc.
};

/**
 * Compresses a UTF-8 string using Brotli with parameters tuned for textual data.
 *
 * @param value - The string to compress.
 * @returns A Brotli compressed buffer.
 */
export const compressString = (value: string) => {
    const input = Buffer.from(value, 'utf8');

    // Brotli tuned for max compression of text/JSON
    const params: Record<number, number> = {
        [zc.BROTLI_PARAM_QUALITY]: 11, // max quality
        [zc.BROTLI_PARAM_MODE]: zc.BROTLI_MODE_TEXT, // text model helps JSON
        [zc.BROTLI_PARAM_LGWIN]: 24, // larger window can help redundancy
        [zc.BROTLI_PARAM_SIZE_HINT]: input.length, // small speed win, sometimes ratio too
    };

    return brotliCompressSync(input, { params });
};

/**
 * Serializes a value to JSON and compresses it using Brotli, optionally canonicalizing keys
 * for improved compression ratios.
 *
 * @param value - The JSON-compatible value to compress.
 * @param opts - Compression options controlling canonicalization.
 * @returns The compressed JSON buffer.
 */
export const compressJson = (value: unknown, opts: CompressOpts = {}) => {
    const { canonical = true } = opts;
    const json = JSON.stringify(canonical ? canonicalize(value) : value);

    return compressString(json);
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

/**
 * Decompresses a gzipped stream and saves it to a file
 *
 * @param sourceStream - The source stream containing compressed data
 * @param outputFilePath - The path where the decompressed file will be saved
 * @returns Promise resolving to the output file path
 * @throws {Error} When decompression fails
 *
 * @example
 * ```typescript
 * import { createReadStream } from 'fs';
 *
 * const sourceStream = createReadStream('compressed.gz');
 * const outputPath = await decompressFromStream(sourceStream, './output.txt');
 * console.log(`File decompressed to: ${outputPath}`);
 * ```
 */
export const decompressFromStream = async (
    sourceStream: Readable | ReadableStream,
    outputFilePath: string,
): Promise<string> => {
    try {
        const webStream: any = sourceStream instanceof ReadableStream ? sourceStream : Readable.toWeb(sourceStream);

        const decompressedData = await new Response(
            webStream.pipeThrough(new DecompressionStream('gzip')),
        ).arrayBuffer();

        await Bun.write(outputFilePath, decompressedData);

        return outputFilePath;
    } catch (error: any) {
        console.error(error.stack);
        throw new Error(`Failed to decompress stream to ${outputFilePath}: ${error}`);
    }
};
