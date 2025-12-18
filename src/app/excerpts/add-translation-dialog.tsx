'use client';

import { PlusIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useCallback, useMemo, useRef, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TRANSLATION_MODELS } from '@/lib/constants';
import { parseTranslations } from '@/lib/transform/excerpts';
import { validateTranslations } from '@/lib/validation';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';

const STORAGE_KEY = 'translation-model';

/** Get saved model from sessionStorage, falling back to first model */
const getSavedModel = (): string => {
    if (typeof window === 'undefined') {
        return TRANSLATION_MODELS[0].value;
    }
    const saved = sessionStorage.getItem(STORAGE_KEY);
    // Verify the saved model still exists in options
    if (saved && TRANSLATION_MODELS.some((m) => m.value === saved)) {
        return saved;
    }
    return TRANSLATION_MODELS[0].value;
};

/**
 * Dialog content for adding bulk translations to excerpts.
 * Uses uncontrolled textarea for performance and batch store updates.
 * Validates translations on paste to catch AI hallucinations.
 */
export function AddTranslationDialogContent({ onClose }: { onClose?: () => void }) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [selectedModel, setSelectedModelState] = useState<string>(getSavedModel);
    const [validationError, setValidationError] = useState<string | undefined>();

    const setSelectedModel = useCallback((value: string) => {
        setSelectedModelState(value);
        sessionStorage.setItem(STORAGE_KEY, value);
    }, []);

    const applyBulkTranslations = useExcerptsStore((state) => state.applyBulkTranslations);
    const excerpts = useExcerptsStore((state) => state.excerpts);
    const headings = useExcerptsStore((state) => state.headings);
    const footnotes = useExcerptsStore((state) => state.footnotes);

    // Build expected IDs list for order validation
    const expectedIds = useMemo(() => {
        const ids: string[] = [];
        for (const e of excerpts) {
            ids.push(e.id);
        }
        for (const h of headings) {
            ids.push(h.id);
        }
        for (const f of footnotes) {
            ids.push(f.id);
        }
        return ids;
    }, [excerpts, headings, footnotes]);

    // Track if we just pasted to avoid clearing the error (paste triggers onChange)
    const justPastedRef = useRef(false);

    const handlePaste = useCallback(
        (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
            justPastedRef.current = true;
            // Reset after a short delay
            setTimeout(() => {
                justPastedRef.current = false;
            }, 100);

            const pastedText = e.clipboardData.getData('text');

            if (!pastedText.trim()) {
                return;
            }

            // Validate the pasted content
            const result = validateTranslations(pastedText, expectedIds);

            if (!result.isValid) {
                setValidationError(result.error);
            } else {
                setValidationError(undefined);
            }

            // If text was normalized (merged markers split), update the textarea
            if (result.normalizedText !== pastedText) {
                e.preventDefault();
                const textarea = textareaRef.current;
                if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const currentValue = textarea.value;
                    const newValue = currentValue.slice(0, start) + result.normalizedText + currentValue.slice(end);
                    textarea.value = newValue;
                    // Set cursor position after pasted text
                    const newPosition = start + result.normalizedText.length;
                    textarea.setSelectionRange(newPosition, newPosition);
                }
            }
        },
        [expectedIds],
    );

    const handleChange = useCallback(() => {
        // Don't clear error if we just pasted (paste also triggers onChange)
        if (justPastedRef.current) {
            return;
        }
        // Clear validation error when user manually edits
        if (validationError) {
            setValidationError(undefined);
        }
    }, [validationError]);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();

            const rawText = textareaRef.current?.value || '';

            if (!rawText.trim()) {
                toast.error('Please enter some translations');
                return;
            }

            // Re-validate before submit
            const validation = validateTranslations(rawText, expectedIds);
            if (!validation.isValid) {
                setValidationError(validation.error);
                toast.error(`Validation failed: ${validation.error}`);
                return;
            }

            const { translationMap, count } = parseTranslations(validation.normalizedText);

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
        [selectedModel, applyBulkTranslations, onClose, expectedIds],
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
                    <Label htmlFor="model">Model:</Label>
                    <ToggleGroup
                        onValueChange={(value) => value && setSelectedModel(value)}
                        type="single"
                        value={selectedModel}
                    >
                        {TRANSLATION_MODELS.map((model) => (
                            <ToggleGroupItem
                                className={`text-xs bg-${model.color}-100 data-[state=on]:bg-${model.color}-400 data-[state=off]:opacity-50`}
                                key={model.value}
                                value={model.value}
                            >
                                [{model.value}] {model.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-2">
                    <Label htmlFor="translations">Translations:</Label>
                    <Textarea
                        className={`min-h-0 flex-1 resize-none text-base ${validationError ? 'border-red-500' : ''}`}
                        id="translations"
                        onChange={handleChange}
                        onPaste={handlePaste}
                        placeholder={`P11622a - ʿImrān al-Qaṭṭān; he is Ibn Dāwar. It has preceded.
Another line that is for this excerpt.

C11623 - Those whose name is ʿUmayr and ʿUmayrah

Another line that should be appended to this existing excerpt.`}
                        ref={textareaRef}
                    />
                    {validationError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">
                            ⚠️ {validationError}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button disabled={!!validationError} type="submit">
                        Save Translations
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
