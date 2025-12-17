'use client';

import { PlusIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TRANSLATION_MODELS } from '@/lib/constants';
import { parseTranslations } from '@/lib/transform/excerpts';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';

/**
 * Dialog content for adding bulk translations to excerpts.
 * Uses uncontrolled textarea for performance and batch store updates.
 */
export function AddTranslationDialogContent({ onClose }: { onClose?: () => void }) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [selectedModel, setSelectedModel] = useState<string>(TRANSLATION_MODELS[0].value);

    const applyBulkTranslations = useExcerptsStore((state) => state.applyBulkTranslations);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();

            const rawText = textareaRef.current?.value || '';

            if (!rawText.trim()) {
                toast.error('Please enter some translations');
                return;
            }

            const { translationMap, count } = parseTranslations(rawText);

            if (count === 0) {
                toast.error('No valid translations found. Format: ID - Translation text');
                return;
            }

            const translatorValue = Number.parseInt(selectedModel, 10);
            const { updated, total } = applyBulkTranslations(translationMap, translatorValue);

            record('AddBulkTranslations', `${updated}/${total}`);

            if (updated === 0) {
                toast.error(`No matching excerpts found for ${total} translations`);
                return;
            }

            if (updated < total) {
                toast.warning(`Updated ${updated} of ${total} translations`);
            } else {
                toast.success(`Successfully updated ${updated} translations`);
            }

            onClose?.();
        },
        [selectedModel, applyBulkTranslations, onClose],
    );

    return (
        <DialogContent className="!max-w-[90vw] flex h-[85vh] w-[90vw] flex-col">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <PlusIcon className="h-5 w-5" />
                    Add Translations
                </DialogTitle>
                <DialogDescription>
                    Paste translations in the format: ID - Translation text. Multi-line translations are supported.
                </DialogDescription>
            </DialogHeader>

            <form className="flex flex-1 flex-col gap-4 overflow-hidden" onSubmit={handleSubmit}>
                <div className="flex items-center gap-4">
                    <Label className="w-20" htmlFor="model">
                        Model:
                    </Label>
                    <Select onValueChange={setSelectedModel} value={selectedModel}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                            {TRANSLATION_MODELS.map((model) => (
                                <SelectItem key={model.value} value={model.value}>
                                    {model.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-2">
                    <Label htmlFor="translations">Translations:</Label>
                    <Textarea
                        className="min-h-0 flex-1 resize-none text-base"
                        id="translations"
                        placeholder={`P11622a - ʿImrān al-Qaṭṭān; he is Ibn Dāwar. It has preceded.
Another line that is for this excerpt.

C11623 - Those whose name is ʿUmayr and ʿUmayrah

Another line that should be appended to this existing excerpt.`}
                        ref={textareaRef}
                    />
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button type="submit">Save Translations</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
