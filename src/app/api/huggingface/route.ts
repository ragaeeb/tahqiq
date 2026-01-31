import { type NextRequest, NextResponse } from 'next/server';
import { decompressJson } from '@/lib/compression';
import { createJsonStream, downloadFromHuggingFace } from '@/lib/network';

/**
 * Generic API route to download files from HuggingFace datasets.
 *
 * Query parameters:
 * - dataset: The HuggingFace dataset ID (e.g., "username/dataset-name")
 * - file: The filename to download (e.g., "1.json.br" or "data.json")
 *
 * Headers:
 * - Authorization: Bearer <apiKey>
 *
 * Returns the file data as a streamed JSON response.
 * Handles .br (Brotli) decompression automatically.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const dataset = searchParams.get('dataset');
    const file = searchParams.get('file');
    const authHeader = req.headers.get('Authorization');

    // Validate request parameters
    if (!dataset) {
        return NextResponse.json({ error: 'Missing required query parameter: dataset' }, { status: 400 });
    }

    if (!file) {
        return NextResponse.json({ error: 'Missing required query parameter: file' }, { status: 400 });
    }

    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    try {
        const blob = await downloadFromHuggingFace({ pathInRepo: file, repoId: dataset, signal: req.signal, token });

        let data: unknown;
        const buffer = await blob.arrayBuffer();

        if (file.endsWith('.br')) {
            data = decompressJson(buffer);
        } else if (file.endsWith('.json')) {
            const text = new TextDecoder().decode(buffer);
            data = JSON.parse(text);
        } else {
            // Fallback: try parsing as JSON, if fail return error or raw?
            // For now, let's assume it must be JSON compatible since we use createJsonStream
            try {
                const text = new TextDecoder().decode(buffer);
                data = JSON.parse(text);
            } catch {
                return NextResponse.json(
                    { error: 'Unsupported file format. Expected JSON or Brotli-compressed JSON.' },
                    { status: 400 },
                );
            }
        }

        const stream = createJsonStream(data);

        return new Response(stream, {
            headers: { 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' },
        });
    } catch (error) {
        console.error('HuggingFace download error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to download file' },
            { status: 500 },
        );
    }
}
