import { join } from 'node:path';
import process from 'node:process';
import { type NextRequest, NextResponse } from 'next/server';
import { configure, getBook, resetConfig } from 'shamela';

/**
 * Downloads a book from the Shamela database.
 *
 * Query parameters:
 * - bookId: The Shamela book ID
 *
 * Headers:
 * - Authorization: Bearer <apiKey>
 * - X-Shamela-Endpoint: The Shamela books endpoint URL
 *
 * Returns the book data (pages and titles) as JSON.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const bookId = searchParams.get('bookId');
        const authHeader = req.headers.get('Authorization');
        const booksEndpoint = req.headers.get('X-Shamela-Endpoint');

        if (!bookId) {
            return NextResponse.json({ error: 'Missing required query parameter: bookId' }, { status: 400 });
        }

        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        if (!booksEndpoint) {
            return NextResponse.json({ error: 'Missing required header: X-Shamela-Endpoint' }, { status: 400 });
        }

        const apiKey = authHeader.slice(7); // Remove 'Bearer ' prefix

        // Configure shamela with provided credentials
        configure({
            apiKey,
            booksEndpoint,
            masterPatchEndpoint: booksEndpoint.replace('book-updates', 'master'),
            sqlJsWasmUrl: join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
        });

        try {
            const bookData = await getBook(parseInt(bookId, 10));

            return NextResponse.json({
                majorRelease: 1, // Default since getBook doesn't return this
                pages: bookData.pages,
                shamelaId: parseInt(bookId, 10),
                titles: bookData.titles,
            });
        } finally {
            // Reset config to avoid leaking credentials
            resetConfig();
        }
    } catch (error) {
        console.error('Shamela download error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch book from Shamela' },
            { status: 500 },
        );
    }
}
