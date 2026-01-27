import { join } from 'node:path';
import process from 'node:process';
import { type NextRequest, NextResponse } from 'next/server';
import { configure, getBook, resetConfig } from 'shamela';

/**
 * Downloads a book from the Shamela database and streams the response.
 *
 * Query parameters:
 * - bookId: The Shamela book ID
 *
 * Headers:
 * - Authorization: Bearer <apiKey>
 * - X-Shamela-Endpoint: The Shamela books endpoint URL
 *
 * Returns the book data (pages and titles) as a streamed JSON response.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId');
    const authHeader = req.headers.get('Authorization');
    const booksEndpoint = req.headers.get('X-Shamela-Endpoint');

    // Validate request parameters
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
    const encoder = new TextEncoder();

    // Create a streaming response
    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Configure shamela with provided credentials
                configure({
                    apiKey,
                    booksEndpoint,
                    masterPatchEndpoint: booksEndpoint.replace('book-updates', 'master'),
                    sqlJsWasmUrl: join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
                });

                const bookData = await getBook(parseInt(bookId, 10));

                // Construct the response object
                const responseData = {
                    majorRelease: 1, // Default since getBook doesn't return this
                    pages: bookData.pages,
                    shamelaId: parseInt(bookId, 10),
                    titles: bookData.titles,
                };

                // Serialize to JSON
                const json = JSON.stringify(responseData);

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
            } finally {
                // Reset config to avoid leaking credentials
                resetConfig();
            }
        },
    });

    return new Response(stream, { headers: { 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' } });
}
