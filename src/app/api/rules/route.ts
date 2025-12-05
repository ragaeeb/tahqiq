import { NextResponse } from 'next/server';
import type { Rule } from 'trie-rules';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Fetches data from a URL with retry logic
 */
async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return response;
            }
            // If not the last retry, wait before trying again
            if (i < retries - 1) {
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (i + 1)));
            }
        } catch (error) {
            // If not the last retry, wait before trying again
            if (i < retries - 1) {
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (i + 1)));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Max retries exceeded');
}

/**
 * Handles GET requests to fetch ALA-LC transliteration rules.
 *
 * Downloads rules from a predefined pastebin URL and returns them as JSON.
 *
 * @returns A JSON response containing the rules array or an error message.
 */
export async function GET() {
    try {
        const response = await fetchWithRetry(process.env.RULES_ENDPOINT!);
        const rawRules = (await response.json()) as Rule[];

        if (!Array.isArray(rawRules) || rawRules.length === 0) {
            return NextResponse.json({ error: 'Invalid rules format or empty rules' }, { status: 500 });
        }

        return NextResponse.json({ rules: rawRules });
    } catch (error) {
        console.error('Failed to fetch rules:', error);
        return NextResponse.json({ error: 'Failed to fetch transliteration rules' }, { status: 500 });
    }
}
