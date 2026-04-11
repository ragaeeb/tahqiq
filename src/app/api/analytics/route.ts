import { type NextRequest, NextResponse } from 'next/server';

const isShadowStaticExport = process.env.TAHQIQ_STATIC_EXPORT === '1';

export const dynamic = 'force-static';

export async function POST(req: NextRequest) {
    if (isShadowStaticExport) {
        return NextResponse.json({ ok: true });
    }

    try {
        if (!process.env.NANOLYTICS_ENDPOINT) {
            console.error('NANOLYTICS_ENDPOINT not set');
            return NextResponse.json({ error: 'Missing Nanolytics endpoint.' }, { status: 500 });
        }

        const response = await fetch(process.env.NANOLYTICS_ENDPOINT, {
            body: await req.text(),
            headers: { 'Content-Type': 'application/json' },
            method: 'PUT',
        });

        if (!response.ok) {
            throw new Error(`External API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(`API Result Error: ${result.error}`);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Analytics submission error:', error);
        return NextResponse.json({ error: 'Failed to submit.' }, { status: 500 });
    }
}
