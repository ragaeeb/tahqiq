'use client';

import { removeMarkdownFormatting } from 'bitaboom';
import { record } from 'nanolytics';
import { useState } from 'react';

import type { TranslateRequestBody } from '@/types/api';

import { Button } from '@/components/ui/button';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TRANSLATE_BOOK_PROMPT } from '@/lib/constants';
import { useSettingsStore } from '@/stores/settingsStore/useSettingsStore';

type TranslateDialogProps = {
    defaultPrompt: string;
    defaultText: string;
};

/**
 * Displays a dialog for translating a book via AI.
 */
export function TranslateDialog({ defaultPrompt, defaultText }: TranslateDialogProps) {
    const rawKeys = useSettingsStore((state) => state.geminiApiKeys);
    const apiKeyValues = [...Array(rawKeys.length).keys()];
    const [apiKey, setApiKey] = useState(apiKeyValues[0]?.toString());
    const [isLoading, setIsLoading] = useState(false);

    const handleTranslate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);

        record('Translate', (data.get('text') as string).length.toString(), {
            promptChanged: data.get('prompt') !== TRANSLATE_BOOK_PROMPT,
        });

        setIsLoading(true);

        const promptTextArea = e.currentTarget.querySelector('textarea[name="prompt"]') as HTMLTextAreaElement;

        try {
            const res = await fetch('/api/translate', {
                body: JSON.stringify({
                    apiKey: rawKeys[parseInt(apiKey)],
                    model: 'gemini-2.5-pro',
                    prompt: [data.get('prompt'), data.get('text')].join('\n\n'),
                } satisfies TranslateRequestBody),
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            });
            const responseData = await res.json();

            if (!res.ok) {
                throw new Error(`Translation failed: ${responseData.error || 'Unknown error'}`);
            }

            if (!responseData.text) {
                throw new Error('Received empty translation response');
            }

            record('TranslationSuccess');
            promptTextArea.value = removeMarkdownFormatting(responseData.text);
        } catch (error) {
            record('TranslationFailure');

            console.error('Translation error:', error);

            promptTextArea.value = `Translation failed: ${error instanceof Error ? error.message : 'Network or server error'}`;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DialogContent className="flex max-h-[80vh] w-[80vw] flex-col sm:max-w-none">
            <DialogHeader>
                <DialogTitle>Translate</DialogTitle>
                <Select onValueChange={setApiKey} value={apiKey}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="API Key" />
                    </SelectTrigger>
                    <SelectContent>
                        {apiKeyValues.map((key) => (
                            <SelectItem key={key} value={key.toString()}>
                                API Key {key}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </DialogHeader>

            <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleTranslate}>
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                    <Textarea
                        className="h-24 flex-shrink-0 resize-none text-xs"
                        defaultValue={defaultPrompt}
                        name="prompt"
                        placeholder="Enter translation prompt..."
                    />
                    <Textarea
                        className="min-h-0 flex-1 resize-none text-sm"
                        defaultValue={defaultText}
                        dir="rtl"
                        name="text"
                        placeholder="Text to translate will appear here..."
                    />
                </div>
                <DialogFooter className="mt-4 flex-shrink-0">
                    <Button className="bg-blue-500" disabled={isLoading} type="submit">
                        {isLoading ? 'Translating...' : 'Translate'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
