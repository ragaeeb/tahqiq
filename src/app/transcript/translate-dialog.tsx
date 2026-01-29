'use client';

import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type TranslateDialogProps = { defaultText: string };

/**
 * Displays a dialog for translating a book via AI.
 */
export function TranslateDialog({ defaultText }: TranslateDialogProps) {
    return (
        <DialogContent className="flex max-h-[80vh] w-[80vw] flex-col sm:max-w-none">
            <DialogHeader>
                <DialogTitle>Translate</DialogTitle>
            </DialogHeader>

            <form className="flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                    <Textarea
                        className="min-h-0 flex-1 resize-none text-sm"
                        defaultValue={defaultText}
                        dir="rtl"
                        name="text"
                        placeholder="Text to translate will appear here..."
                    />
                </div>
            </form>
        </DialogContent>
    );
}
