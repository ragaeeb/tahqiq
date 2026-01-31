import { downloadFile, uploadFile } from '@huggingface/hub';

type HuggingFaceDownloadOptions = {
    /** Repository ID (e.g., "username/repo-name") */
    repoId: string;
    /** Path/filename in the repository (e.g., "data/file.json") */
    pathInRepo: string;
    /** HuggingFace API token */
    token: string;
    /** Optional AbortSignal for request cancellation */
    signal?: AbortSignal;
    /** Timeout in milliseconds (default: 30000) */
    timeoutMs?: number;
};

/**
 * Options for uploading to HuggingFace
 */
type HuggingFaceUploadOptions = HuggingFaceDownloadOptions & {
    /** The data to upload */
    fileBlob: Blob;
};

/**
 * Uploads a file to HuggingFace Hub using the official @huggingface/hub library
 *
 * @param options - Upload configuration options
 * @returns Promise resolving to the file URL on HuggingFace
 * @throws {Error} When upload fails
 *
 * @example
 * ```typescript
 * const url = await uploadToHuggingFace({
 *     filePath: './data.json.zip',
 *     repoId: 'username/my-dataset',
 *     pathInRepo: '123.json.zip',
 *     token: process.env.HF_TOKEN!,
 * });
 * console.log(`Uploaded to: ${url}`);
 * ```
 */
export const uploadToHuggingFace = async ({ fileBlob, repoId, pathInRepo, token }: HuggingFaceUploadOptions) => {
    console.info(`Uploading to HuggingFace...`);
    console.info(`Repository: ${repoId}`);
    console.info(`Path: ${pathInRepo}`);

    await uploadFile({
        commitTitle: `Upload ${pathInRepo}`,
        credentials: { accessToken: token },
        file: { content: fileBlob, path: pathInRepo },
        hubUrl: 'https://huggingface.co',
        repo: { name: repoId, type: 'dataset' },
    });

    const fileUrl = `https://huggingface.co/datasets/${repoId}/resolve/main/${pathInRepo}`;
    console.info(`Upload complete: ${fileUrl}`);

    return fileUrl;
};

const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Creates a fetch function with timeout handling.
 * Combines an external signal (if provided) with an internal timeout signal.
 */
const createTimeoutFetch = (
    timeoutMs: number,
    externalSignal?: AbortSignal,
): ((input: URL | RequestInfo, init?: RequestInit) => Promise<Response>) => {
    return async (input, init) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        // If external signal aborts, also abort our controller
        const onExternalAbort = () => controller.abort();
        externalSignal?.addEventListener('abort', onExternalAbort);

        try {
            return await fetch(input, { ...init, signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
            externalSignal?.removeEventListener('abort', onExternalAbort);
        }
    };
};

export const downloadFromHuggingFace = async ({
    repoId,
    pathInRepo,
    token,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
}: HuggingFaceDownloadOptions) => {
    console.log('Downloading from HuggingFace...');
    console.info(`Repository: ${repoId}`);
    console.info(`Path: ${pathInRepo}`);

    const timeoutFetch = createTimeoutFetch(timeoutMs, signal);

    const blob = await downloadFile({
        credentials: { accessToken: token },
        fetch: timeoutFetch as any,
        hubUrl: 'https://huggingface.co',
        path: pathInRepo,
        repo: { name: repoId, type: 'dataset' },
    });

    if (!blob) {
        throw new Error(`File not found: ${pathInRepo} in ${repoId}`);
    }

    return blob;
};

/**
 * Reads a streaming response and reconstructs the JSON
 */
export const readStreamedJson = async <T>(response: Response): Promise<T> => {
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let result = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            result += decoder.decode(value, { stream: true });
        }
        // Final decode to flush any remaining bytes
        result += decoder.decode();

        return JSON.parse(result);
    } finally {
        reader.releaseLock();
    }
};

export const createJsonStream = (data: unknown) => {
    const encoder = new TextEncoder();

    // Create a streaming response
    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Serialize to JSON
                const json = JSON.stringify(data);

                // Stream in 64KB chunks to avoid payload limits
                const chunkSize = 64 * 1024;
                for (let i = 0; i < json.length; i += chunkSize) {
                    const chunk = json.slice(i, i + chunkSize);
                    controller.enqueue(encoder.encode(chunk));
                }

                controller.close();
            } catch (error) {
                console.error('Shamela download error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Failed to fetch book from Shamela';
                const errorResponse = JSON.stringify({ error: errorMessage });
                controller.enqueue(encoder.encode(errorResponse));
                controller.close();
            }
        },
    });

    return stream;
};
