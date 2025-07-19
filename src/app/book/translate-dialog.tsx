'use client';

import { record } from 'nanolytics';
import { useMemo, useState } from 'react';

import { ClickToReveal } from '@/components/click-to-reveal';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { generateTranslationText } from '@/lib/ai';
import { TRANSLATE_BOOK_PROMPT } from '@/lib/constants';
import { selectCurrentPages } from '@/stores/bookStore/selectors';
import { useBookStore } from '@/stores/bookStore/useBookStore';

/**
 * Displays a dialog for translating a book via AI.
 */
export function TranslateDialog() {
    const pages = useBookStore(selectCurrentPages);
    const [prompt, setPrompt] = useState(TRANSLATE_BOOK_PROMPT);
    const text = useMemo(() => {
        const nusus = generateTranslationText(pages.filter((p) => p.text)).join('\n\n');
        return nusus;
    }, [pages]);
    const apiKey = localStorage.getItem('GEMINI_API_KEY');

    return (
        <DialogContent className="w-[80vw] sm:max-w-none max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Translate</DialogTitle>
                <ClickToReveal
                    defaultValue={apiKey ? atob(apiKey) : ''}
                    onSubmit={(value) => {
                        console.log('FUMPING', value);
                    }}
                    placeholder="Enter your API key"
                />
            </DialogHeader>
            <div className="flex-1 overflow-auto">
                <Textarea
                    className="w-full resize-none text-xs"
                    onChange={(e) => {
                        record('EditPrompt');
                        setPrompt(e.target.value);
                    }}
                    value={prompt}
                />
                <Textarea className="w-full h-full resize-none text-sm" defaultValue={text} dir="rtl" disabled />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button
                        onClick={() => {
                            record('CopyTranscriptToClipboard');
                            navigator.clipboard.writeText([prompt, text].join('\n\n'));
                        }}
                        type="submit"
                    >
                        Copy to Clipboard
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    );
}
