export type TranslateRequestBody = {
    apiKey: string;
    model: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite-preview-06-17' | 'gemini-2.5-pro';
    prompt: string;
};
