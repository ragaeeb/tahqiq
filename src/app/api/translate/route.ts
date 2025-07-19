import { createUserContent, GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

type TranslateRequestBody = {
    apiKey: string;
    model: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite-preview-06-17' | 'gemini-2.5-pro';
    prompt: string;
};

const validateFields = (data: Record<string, any>, requiredFields: string[]) => {
    const missing = requiredFields.filter((field) => !data[field]?.trim?.());

    if (missing.length > 0) {
        return NextResponse.json(
            {
                error: `Missing required fields: ${missing.join(', ')}`,
                fields: missing,
            },
            { status: 400 },
        );
    }

    return null;
};

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
        const body: TranslateRequestBody = await req.json();

        const validationError = validateFields(body, ['apiKey', 'model', 'prompt']);

        if (validationError) {
            return validationError;
        }

        const client = new GoogleGenAI({
            apiKey: body.apiKey,
        });

        const result = await client.models.generateContent({
            contents: createUserContent([body.prompt]),
            model: body.model,
        });

        return NextResponse.json({ text: result.text });
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json({ error: 'Failed to translate.' }, { status: 500 });
    }
}
