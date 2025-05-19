import { createUserContent, GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Missing "text" in request body.' }, { status: 400 });
        }

        if (!process.env.GOOGLE_GENAI_API_KEY) {
            console.error('GOOGLE_GENAI_API_KEY not set:');
            return NextResponse.json({ error: 'Missing Google Gemini API key.' }, { status: 500 });
        }

        const client = new GoogleGenAI({
            apiKey: process.env.GOOGLE_GENAI_API_KEY,
        });

        console.log('issuing', process.env.GOOGLE_GENAI_API_KEY, 'model', process.env.GOOGLE_GENAI_MODEL);
        console.log('prompt', process.env.TRANSLATION_PROMPT);
        console.log('text', text);

        const result = await client.models.generateContent({
            contents: createUserContent([`${process.env.TRANSLATION_PROMPT}\n\n${text}`]),
            model: process.env.GOOGLE_GENAI_MODEL!,
        });

        return NextResponse.json({ text: result.text });
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json({ error: 'Failed to translate.' }, { status: 500 });
    }
}
