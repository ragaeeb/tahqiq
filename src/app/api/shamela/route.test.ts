import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { NextRequest } from 'next/server';

import { GET } from './route';

// Mock the shamela module
const mockConfigure = mock(() => {});
const mockGetBook = mock(() =>
    Promise.resolve({
        pages: [{ content: 'Page 1 content', id: 1 }],
        titles: [{ content: 'Title 1', id: 1, page: 1 }],
    }),
);
const mockResetConfig = mock(() => {});

mock.module('shamela', () => ({ configure: mockConfigure, getBook: mockGetBook, resetConfig: mockResetConfig }));

/**
 * Helper to read a streaming response into a string
 */
async function readStream(response: Response): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('No body');
    }

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

    return result;
}

describe('shamela API route', () => {
    beforeEach(() => {
        mockConfigure.mockClear();
        mockGetBook.mockClear();
        mockResetConfig.mockClear();
    });

    it('should return 400 if bookId is missing', async () => {
        const req = new NextRequest('http://localhost/api/shamela');

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required query parameter: bookId');
    });

    it('should return 401 if Authorization header is missing', async () => {
        const req = new NextRequest('http://localhost/api/shamela?bookId=1681');

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Missing or invalid Authorization header');
    });

    it('should return 401 if Authorization header does not start with Bearer', async () => {
        const req = new NextRequest('http://localhost/api/shamela?bookId=1681', {
            headers: { Authorization: 'Basic abc123' },
        });

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Missing or invalid Authorization header');
    });

    it('should return 400 if X-Shamela-Endpoint header is missing', async () => {
        const req = new NextRequest('http://localhost/api/shamela?bookId=1681', {
            headers: { Authorization: 'Bearer test-api-key' },
        });

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required header: X-Shamela-Endpoint');
    });

    it('should successfully download a book with valid params using streaming', async () => {
        const req = new NextRequest('http://localhost/api/shamela?bookId=1681', {
            headers: {
                Authorization: 'Bearer test-api-key',
                'X-Shamela-Endpoint': 'https://api.shamela.ws/book-updates',
            },
        });

        const response = await GET(req);

        // Verify headers
        expect(response.headers.get('Content-Type')).toBe('application/json');
        expect(response.headers.get('Transfer-Encoding')).toBe('chunked');

        // Read the streamed response
        const jsonString = await readStream(response);
        const data = JSON.parse(jsonString);

        expect(data.shamelaId).toBe(1681);
        expect(data.majorRelease).toBe(1);
        expect(data.pages).toHaveLength(1);
        expect(data.titles).toHaveLength(1);
        expect(mockConfigure).toHaveBeenCalledTimes(1);
        expect(mockGetBook).toHaveBeenCalledWith(1681);
        expect(mockResetConfig).toHaveBeenCalledTimes(1);
    });

    it('should configure shamela with correct parameters', async () => {
        const req = new NextRequest('http://localhost/api/shamela?bookId=123', {
            headers: {
                Authorization: 'Bearer my-secret-key',
                'X-Shamela-Endpoint': 'https://custom.endpoint.com/book-updates',
            },
        });

        await GET(req);

        expect(mockConfigure).toHaveBeenCalledWith(
            expect.objectContaining({
                apiKey: 'my-secret-key',
                booksEndpoint: 'https://custom.endpoint.com/book-updates',
                masterPatchEndpoint: 'https://custom.endpoint.com/master',
            }),
        );
    });

    it('should stream error message when getBook throws', async () => {
        mockGetBook.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

        const req = new NextRequest('http://localhost/api/shamela?bookId=1681', {
            headers: {
                Authorization: 'Bearer test-api-key',
                'X-Shamela-Endpoint': 'https://api.shamela.ws/book-updates',
            },
        });

        // Suppress console.error for this test
        const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});

        const response = await GET(req);

        // Read the streamed error response
        const jsonString = await readStream(response);
        const data = JSON.parse(jsonString);

        expect(data.error).toBe('Network error');
        expect(mockResetConfig).toHaveBeenCalledTimes(1); // Should still reset config

        consoleSpy.mockRestore();
    });

    it('should stream generic error message for non-Error exceptions', async () => {
        mockGetBook.mockImplementationOnce(() => Promise.reject('String error'));

        const req = new NextRequest('http://localhost/api/shamela?bookId=1681', {
            headers: {
                Authorization: 'Bearer test-api-key',
                'X-Shamela-Endpoint': 'https://api.shamela.ws/book-updates',
            },
        });

        const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});

        const response = await GET(req);

        // Read the streamed error response
        const jsonString = await readStream(response);
        const data = JSON.parse(jsonString);

        expect(data.error).toBe('Failed to fetch book from Shamela');

        consoleSpy.mockRestore();
    });

    it('should always call resetConfig even on success', async () => {
        const req = new NextRequest('http://localhost/api/shamela?bookId=1681', {
            headers: {
                Authorization: 'Bearer test-api-key',
                'X-Shamela-Endpoint': 'https://api.shamela.ws/book-updates',
            },
        });

        await GET(req);

        expect(mockResetConfig).toHaveBeenCalledTimes(1);
    });

    it('should stream large responses in chunks', async () => {
        // Create a large mock response (> 64KB)
        const largePage = { content: 'A'.repeat(100000), id: 1 };
        mockGetBook.mockImplementationOnce(() =>
            Promise.resolve({ pages: [largePage], titles: [{ content: 'Title 1', id: 1, page: 1 }] }),
        );

        const req = new NextRequest('http://localhost/api/shamela?bookId=1681', {
            headers: {
                Authorization: 'Bearer test-api-key',
                'X-Shamela-Endpoint': 'https://api.shamela.ws/book-updates',
            },
        });

        const response = await GET(req);
        const jsonString = await readStream(response);
        const data = JSON.parse(jsonString);

        // Verify the large content was streamed correctly
        expect(data.pages[0].content).toBe('A'.repeat(100000));
        expect(data.pages).toHaveLength(1);
    });
});
