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

    it('should successfully download a book with valid params', async () => {
        const req = new NextRequest('http://localhost/api/shamela?bookId=1681', {
            headers: {
                Authorization: 'Bearer test-api-key',
                'X-Shamela-Endpoint': 'https://api.shamela.ws/book-updates',
            },
        });

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
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

    it('should return 500 and error message when getBook throws', async () => {
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
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Network error');
        expect(mockResetConfig).toHaveBeenCalledTimes(1); // Should still reset config

        consoleSpy.mockRestore();
    });

    it('should return generic error message for non-Error exceptions', async () => {
        mockGetBook.mockImplementationOnce(() => Promise.reject('String error'));

        const req = new NextRequest('http://localhost/api/shamela?bookId=1681', {
            headers: {
                Authorization: 'Bearer test-api-key',
                'X-Shamela-Endpoint': 'https://api.shamela.ws/book-updates',
            },
        });

        const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(500);
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
});
