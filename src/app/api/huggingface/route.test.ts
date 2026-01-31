import { describe, expect, it, mock } from 'bun:test';

// Mock dependencies
const mockDownloadFromHuggingFace = mock((_opts: any) =>
    Promise.resolve(new Blob(['{"test":"data"}'], { type: 'application/json' })),
);
const mockDecompressJson = mock((_buffer: any) => ({ decompressed: true }));

mock.module('@/lib/network', () => ({
    createJsonStream: (data: any) =>
        new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(JSON.stringify(data)));
                controller.close();
            },
        }),
    downloadFromHuggingFace: mockDownloadFromHuggingFace,
}));

mock.module('@/lib/compression', () => ({ decompressJson: mockDecompressJson }));

describe('GET /api/huggingface', () => {
    const baseUrl = 'http://localhost:3000/api/huggingface';

    it('should return 400 if dataset param is missing', async () => {
        const { GET } = await import('./route');
        const req = new Request(`${baseUrl}?file=test.json`);
        const res = await GET(req as any);

        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe('Missing required query parameter: dataset');
    });

    it('should return 400 if file param is missing', async () => {
        const { GET } = await import('./route');
        const req = new Request(`${baseUrl}?dataset=user/repo`);
        const res = await GET(req as any);

        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe('Missing required query parameter: file');
    });

    it('should return 401 if Authorization header is missing or invalid', async () => {
        const { GET } = await import('./route');
        const req = new Request(`${baseUrl}?dataset=user/repo&file=test.json`);
        const res = await GET(req as any);

        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe('Missing or invalid Authorization header');
    });

    it('should download and stream JSON file', async () => {
        const { GET } = await import('./route');
        const req = new Request(`${baseUrl}?dataset=user/repo&file=test.json`, {
            headers: { Authorization: 'Bearer valid-token' },
        });

        const res = await GET(req as any);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('application/json');

        const json = await res.json();
        expect(json).toEqual({ test: 'data' });

        expect(mockDownloadFromHuggingFace).toHaveBeenCalledWith({
            pathInRepo: 'test.json',
            repoId: 'user/repo',
            signal: req.signal,
            token: 'valid-token',
        });
    });

    it('should handle Brotli compressed files (.br)', async () => {
        const { GET } = await import('./route');
        // Stub download to return something for .br check
        mockDownloadFromHuggingFace.mockResolvedValueOnce(new Blob(['compressed']) as any);

        const req = new Request(`${baseUrl}?dataset=user/repo&file=test.json.br`, {
            headers: { Authorization: 'Bearer valid-token' },
        });

        const res = await GET(req as any);

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toEqual({ decompressed: true });
        expect(mockDecompressJson).toHaveBeenCalled();
    });

    it('should return 400 for unsupported file formats', async () => {
        const { GET } = await import('./route');
        mockDownloadFromHuggingFace.mockResolvedValueOnce(new Blob(['binary data']) as any);

        const req = new Request(`${baseUrl}?dataset=user/repo&file=image.png`, {
            headers: { Authorization: 'Bearer valid-token' },
        });

        const res = await GET(req as any);
        // It tries to parse as JSON in the fallback block
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe('Unsupported file format. Expected JSON or Brotli-compressed JSON.');
    });

    it('should return 500 if download fails', async () => {
        const { GET } = await import('./route');
        mockDownloadFromHuggingFace.mockRejectedValueOnce(new Error('Network error'));

        const req = new Request(`${baseUrl}?dataset=user/repo&file=test.json`, {
            headers: { Authorization: 'Bearer valid-token' },
        });

        const res = await GET(req as any);

        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.error).toBe('Network error');
    });
});
