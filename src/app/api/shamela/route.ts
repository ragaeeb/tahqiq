import { type NextRequest, NextResponse } from 'next/server';
import { decompressJson } from '@/lib/compression';
import { createJsonStream, downloadFromHuggingFace } from '@/lib/network';

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
    const shamelaDataset = req.headers.get('X-Shamela-Dataset');

    // Validate request parameters
    if (!bookId) {
        return NextResponse.json({ error: 'Missing required query parameter: bookId' }, { status: 400 });
    }

    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    if (!shamelaDataset) {
        return NextResponse.json({ error: 'Missing required header: X-Shamela-Dataset' }, { status: 400 });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    const blob = await downloadFromHuggingFace({ pathInRepo: `${bookId}.json.br`, repoId: shamelaDataset, token });

    const book = decompressJson(await blob.arrayBuffer());
    const stream = createJsonStream(book);

    return new Response(stream, { headers: { 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' } });
}
