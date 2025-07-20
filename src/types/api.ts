/**
 * Request body structure for translation API endpoint.
 */
export type TranslateRequestBody = {
    /** Gemini API key for authentication */
    apiKey: string;

    /** Gemini model identifier for translation */
    model: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite-preview-06-17' | 'gemini-2.5-pro';

    /** Translation prompt including instructions and text to translate */
    prompt: string;
};
