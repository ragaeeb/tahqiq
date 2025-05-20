import { createUserContent, GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Handles POST requests to translate input text using Google Gemini AI.
 *
 * Expects a JSON body with a `text` field and returns the translated text in a JSON response.
 *
 * @returns A JSON response containing the translated text or an error message.
 *
 * @remark
 * Returns a 400 error if the `text` field is missing from the request body, or a 500 error if the Google Gemini API key is not set or if translation fails.
 */
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

        if (!process.env.GOOGLE_GENAI_MODEL) {
            console.error('GOOGLE_GENAI_MODEL not set');
            return NextResponse.json({ error: 'Missing Google Gemini model configuration.' }, { status: 500 });
        }

        if (!process.env.TRANSLATION_PROMPT) {
            console.error('TRANSLATION_PROMPT not set');
            return NextResponse.json({ error: 'Missing translation prompt configuration.' }, { status: 500 });
        }

        const client = new GoogleGenAI({
            apiKey: process.env.GOOGLE_GENAI_API_KEY,
        });

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
