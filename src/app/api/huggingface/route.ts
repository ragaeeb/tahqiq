import { type NextRequest, NextResponse } from 'next/server';
import { compressStringAsync } from '@/lib/compression';
import { uploadToHuggingFace } from '@/lib/network';

/**
 * Uploads compressed excerpt data to HuggingFace dataset.
 *
 * This route:
 * 1. Receives streamed JSON data from the client
 * 2. Compresses it using Brotli
 * 3. Uploads to HuggingFace dataset repository
 *
 * Headers:
 * - Authorization: Bearer <huggingfaceToken>
 * - X-Dataset-Url: The HuggingFace dataset URL
 * - X-Filename: Custom filename (without extension)
 *
 * Body: JSON excerpt data (streamed)
 *
 * Returns success/error status
 */
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const dataset = req.headers.get('X-Dataset');
        const customFilename = req.headers.get('X-Filename');

        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        if (!dataset) {
            return NextResponse.json({ error: 'Missing required header: X-Dataset-Url' }, { status: 400 });
        }

        if (!customFilename) {
            return NextResponse.json({ error: 'Missing required header: X-Filename' }, { status: 400 });
        }

        const token = authHeader.slice(7); // Remove 'Bearer ' prefix

        // Read the entire request body as text (Next.js handles streaming for us)
        const jsonText = await req.text();

        // Compress the JSON data using Brotli
        const compressed = await compressStringAsync(jsonText);

        await uploadToHuggingFace({
            fileBlob: new Blob([compressed]),
            pathInRepo: customFilename,
            repoId: dataset,
            token,
        });

        const originalSize = Buffer.byteLength(jsonText, 'utf8');
        const compressedSize = compressed.length;
        const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

        return NextResponse.json({
            compressedSize,
            compressionRatio: `${compressionRatio}%`,
            filename: customFilename,
            originalSize,
            success: true,
        });
    } catch (error) {
        console.error('HuggingFace upload error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to upload to HuggingFace' },
            { status: 500 },
        );
    }
}
