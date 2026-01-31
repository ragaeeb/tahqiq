import { describe, expect, it, mock } from 'bun:test';

// Mock @huggingface/hub
const mockDownloadFile = mock((_args: any) => Promise.resolve(new Blob(['test content'])));
const mockUploadFile = mock((_args: any) => Promise.resolve({ commit: { oid: 'test-oid' } }));

mock.module('@huggingface/hub', () => ({ downloadFile: mockDownloadFile, uploadFile: mockUploadFile }));

describe('downloadFromHuggingFace', () => {
    it('should call downloadFile with correct parameters', async () => {
        const { downloadFromHuggingFace } = await import('./network');
        const options = { pathInRepo: 'file.json', repoId: 'user/repo', token: 'test-token' };

        const result = await downloadFromHuggingFace(options);

        expect(mockDownloadFile).toHaveBeenCalledWith(
            expect.objectContaining({
                credentials: { accessToken: options.token },
                hubUrl: 'https://huggingface.co',
                path: options.pathInRepo,
                repo: { name: options.repoId, type: 'dataset' },
            }),
        );
        expect(result).toBeInstanceOf(Blob);
    });

    it('should throw error if file not found (blob is null)', async () => {
        const { downloadFromHuggingFace } = await import('./network');
        mockDownloadFile.mockResolvedValueOnce(null as any);

        const options = { pathInRepo: 'missing.json', repoId: 'user/repo', token: 'test-token' };

        expect(downloadFromHuggingFace(options)).rejects.toThrow('File not found: missing.json in user/repo');
    });

    it('should use a custom fetch with timeout', async () => {
        const { downloadFromHuggingFace } = await import('./network');
        const options = { pathInRepo: 'file.json', repoId: 'user/repo', timeoutMs: 100, token: 'test-token' };

        await downloadFromHuggingFace(options);

        // Verify that 'fetch' property was passed to downloadFile
        const callArgs = mockDownloadFile.mock.calls[mockDownloadFile.mock.calls.length - 1][0];
        expect(callArgs.fetch).toBeDefined();
        expect(typeof callArgs.fetch).toBe('function');
    });

    it('should invoke custom fetch and verify timeout logic', async () => {
        const { downloadFromHuggingFace } = await import('./network');
        const abortController = new AbortController();
        const options = {
            pathInRepo: 'file.json',
            repoId: 'user/repo',
            signal: abortController.signal,
            timeoutMs: 100,
            token: 'test-token',
        };

        await downloadFromHuggingFace(options);

        // Extract the custom fetch wrapper passed to downloadFile
        const callArgs = mockDownloadFile.mock.calls[mockDownloadFile.mock.calls.length - 1][0];
        const customFetch = callArgs.fetch;

        // Mock global fetch
        const originalFetch = global.fetch;
        const mockFetch = mock((_url: string, _init?: RequestInit) => Promise.resolve(new Response('ok')));
        global.fetch = mockFetch as any;

        try {
            await customFetch('http://example.com');

            expect(mockFetch).toHaveBeenCalled();
            const fetchInit = mockFetch.mock.calls[0][1];
            expect(fetchInit?.signal).toBeInstanceOf(AbortSignal);
        } finally {
            global.fetch = originalFetch;
        }
    });
});

describe('uploadToHuggingFace', () => {
    it('should call uploadFile with correct parameters', async () => {
        const { uploadToHuggingFace } = await import('./network');
        const fileBlob = new Blob(['content'], { type: 'application/json' });
        const options = { fileBlob, pathInRepo: 'file.json', repoId: 'user/repo', token: 'test-token' };

        const result = await uploadToHuggingFace(options);

        expect(mockUploadFile).toHaveBeenCalledWith(
            expect.objectContaining({
                commitTitle: `Upload file.json`,
                credentials: { accessToken: options.token },
                file: { content: fileBlob, path: options.pathInRepo },
                hubUrl: 'https://huggingface.co',
                repo: { name: options.repoId, type: 'dataset' },
            }),
        );

        expect(result).toBe('https://huggingface.co/datasets/user/repo/resolve/main/file.json');
    });
});

describe('createJsonStream', () => {
    it('should stream JSON data in chunks', async () => {
        const { createJsonStream } = await import('./network');
        const data = { key: 'value'.repeat(1000) };
        const stream = createJsonStream(data);
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        let result = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            result += decoder.decode(value, { stream: true });
        }
        result += decoder.decode();

        expect(JSON.parse(result)).toEqual(data);
    });

    it('should handle circular references or serialization errors gracefully', async () => {
        const { createJsonStream } = await import('./network');
        const circular: any = {};
        circular.self = circular;

        // Suppress console.error for this test
        const originalError = console.error;
        console.error = () => {};

        try {
            const stream = createJsonStream(circular);
            const reader = stream.getReader();
            const { value } = await reader.read();
            const text = new TextDecoder().decode(value);
            const response = JSON.parse(text);

            expect(response.error).toBeDefined();
        } finally {
            console.error = originalError;
        }
    });
});

describe('readStreamedJson', () => {
    it('should parse streamed JSON response', async () => {
        const { readStreamedJson, createJsonStream } = await import('./network');
        const data = { items: [1, 2, 3], success: true };
        const stream = createJsonStream(data);
        const response = new Response(stream);

        const result = await readStreamedJson(response);
        expect(result).toEqual(data);
    });

    it('should throw if response body is null', async () => {
        const { readStreamedJson } = await import('./network');
        const response = new Response(null);
        expect(readStreamedJson(response)).rejects.toThrow('Response body is not readable');
    });
});
