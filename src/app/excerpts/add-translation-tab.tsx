'use client';

import { SaveIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { STORAGE_KEYS, TRANSLATION_MODELS } from '@/lib/constants';
import { saveToOPFS } from '@/lib/io';
import { parseTranslations } from '@/lib/textUtils';
import { nowInSeconds } from '@/lib/time';
import { cn } from '@/lib/utils';
import { findUnmatchedTranslationIds, validateTranslations } from '@/lib/validation';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import { getTranslatorValue, TranslatorSelect } from './translator-select';

const STORAGE_KEY = 'translation-model';

/** Get saved model from sessionStorage, falling back to first model */
const getSavedModel = (): string => {
    if (typeof window === 'undefined') {
        return TRANSLATION_MODELS[0].value;
    }
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && TRANSLATION_MODELS.some((m) => m.value === saved)) {
        return saved;
    }
    return TRANSLATION_MODELS[0].value;
};

/**
 * Tab content for adding bulk translations to excerpts.
 * Uses uncontrolled textarea for performance and batch store updates.
 * Validates translations on paste to catch AI hallucinations.
 */
export function AddTranslationTab() {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [selectedModel, setSelectedModel] = useState<string>(getSavedModel());
    const [validationError, setValidationError] = useState<string | undefined>();
    const [pendingOverwrites, setPendingOverwrites] = useState<{ duplicates: string[]; overwrites: string[] } | null>(
        null,
    );

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

    // Build map of IDs that already have translations
    const existingTranslations = useMemo(() => {
        const map = new Map<string, boolean>();
        for (const e of excerpts) {
            if (e.text?.trim()) {
                map.set(e.id, true);
            }
        }
        for (const h of headings) {
            if (h.text?.trim()) {
                map.set(h.id, true);
            }
        }
        for (const f of footnotes) {
            if (f.text?.trim()) {
                map.set(f.id, true);
            }
        }
        return map;
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
        // Clear pending overwrites when user edits
        if (pendingOverwrites) {
            setPendingOverwrites(null);
        }
    }, [validationError, pendingOverwrites]);

    const doSubmit = useCallback(
        async (translationMap: Map<string, string>, translatorValue: number, total: number, shouldCommit: boolean) => {
            const { updated } = applyBulkTranslations(translationMap, translatorValue);

            record('AddBulkTranslations', `${updated}/${total}`);

            if (updated === 0) {
                toast.error(`No matching excerpts found for ${total} translations`);
                return;
            }

            // Build result message
            let message: string;
            let isWarning = false;

            if (updated < total) {
                message = `Updated ${updated} of ${total} translations`;
                isWarning = true;
            } else {
                message = `Updated ${updated} translations`;
            }

            // If commit requested, save to OPFS
            if (shouldCommit) {
                try {
                    const state = useExcerptsStore.getState();
                    const exportData = {
                        collection: state.collection,
                        contractVersion: state.contractVersion,
                        createdAt: state.createdAt,
                        excerpts: state.excerpts,
                        footnotes: state.footnotes,
                        headings: state.headings,
                        lastUpdatedAt: nowInSeconds(),
                        options: state.options,
                        postProcessingApps: state.postProcessingApps,
                        promptForTranslation: state.promptForTranslation,
                    };
                    await saveToOPFS(STORAGE_KEYS.excerpts, exportData);
                    message += ' & committed';
                    record('CommitTranslationsToStorage');
                } catch (err) {
                    console.error('Failed to commit to storage:', err);
                    toast.error('Translations saved but failed to commit to storage');
                    return;
                }
            }

            // Show single combined toast
            if (isWarning) {
                toast.warning(message);
            } else {
                toast.success(message);
            }

            if (textareaRef.current) {
                textareaRef.current.value = '';
                textareaRef.current.focus();
            }
        },
        [applyBulkTranslations],
    );

    const handleSubmit = useCallback(
        (e: React.FormEvent, shouldCommit = false) => {
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

            // Check for duplicates in pasted content
            const idCounts = new Map<string, number>();
            for (const id of validation.parsedIds) {
                idCounts.set(id, (idCounts.get(id) || 0) + 1);
            }
            const duplicates: string[] = [];
            for (const [id, count] of idCounts) {
                if (count > 1) {
                    duplicates.push(`${id} (×${count})`);
                }
            }

            const { translationMap, count } = parseTranslations(validation.normalizedText);

            if (count === 0) {
                toast.error('No valid translations found. Format: ID - Translation text');
                return;
            }

            // Check for overwrites of existing translations
            const overwrites: string[] = [];
            for (const id of translationMap.keys()) {
                if (existingTranslations.has(id)) {
                    overwrites.push(id);
                }
            }

            const translatorValue = getTranslatorValue(selectedModel);

            // Combine issues for confirmation
            const hasIssues = overwrites.length > 0 || duplicates.length > 0;
            if (hasIssues && !pendingOverwrites) {
                // Show confirmation - don't proceed yet
                setPendingOverwrites({ duplicates, overwrites });
                return;
            }

            // Validate that all translation IDs exist in the store before committing
            const unmatchedIds = findUnmatchedTranslationIds(validation.parsedIds, expectedIds);
            if (unmatchedIds.length > 0) {
                const preview = unmatchedIds.slice(0, 10).join(', ');
                const suffix = unmatchedIds.length > 10 ? ` and ${unmatchedIds.length - 10} more` : '';
                setValidationError(
                    `${unmatchedIds.length} translation ID(s) not found in excerpts: ${preview}${suffix}`,
                );
                return;
            }

            // Either no issues or user confirmed
            setPendingOverwrites(null);
            doSubmit(translationMap, translatorValue, count, shouldCommit);
        },
        [selectedModel, expectedIds, existingTranslations, pendingOverwrites, doSubmit],
    );

    const handleSaveAndCommit = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent, true);
        },
        [handleSubmit],
    );

    return (
        <form className="flex flex-1 flex-col gap-4 overflow-hidden" onSubmit={handleSubmit}>
            <TranslatorSelect onChange={setSelectedModel} value={selectedModel} />

            <div className="flex min-h-0 flex-1 flex-col gap-2">
                <Label htmlFor="translations">Translations:</Label>
                <Textarea
                    className={cn('min-h-0 flex-1 resize-none text-base', validationError && 'border-red-500')}
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
                {pendingOverwrites && (
                    <div className="space-y-2">
                        {pendingOverwrites.duplicates.length > 0 && (
                            <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-orange-800 text-sm">
                                <div className="font-medium">
                                    ⚠️ Duplicate IDs in pasted text (later entries will override earlier ones):
                                </div>
                                <div className="mt-1 max-h-16 overflow-y-auto font-mono text-xs">
                                    {pendingOverwrites.duplicates.join(', ')}
                                </div>
                            </div>
                        )}
                        {pendingOverwrites.overwrites.length > 0 && (
                            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-sm">
                                <div className="font-medium">
                                    ⚠️ {pendingOverwrites.overwrites.length} excerpt(s) already have translations that
                                    will be overwritten:
                                </div>
                                <div className="mt-1 max-h-16 overflow-y-auto font-mono text-xs">
                                    {pendingOverwrites.overwrites.join(', ')}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2">
                {pendingOverwrites ? (
                    <>
                        <Button onClick={() => setPendingOverwrites(null)} type="button" variant="outline">
                            Go Back
                        </Button>
                        <Button className="bg-amber-500 hover:bg-amber-600" type="submit">
                            Confirm ({pendingOverwrites.duplicates.length + pendingOverwrites.overwrites.length} issues)
                        </Button>
                    </>
                ) : (
                    <>
                        <Button disabled={!!validationError} type="submit">
                            Save Translations
                        </Button>
                        <Button
                            disabled={!!validationError}
                            type="button"
                            onClick={handleSaveAndCommit}
                            className="bg-green-600 hover:bg-green-700"
                            title="Save translations and commit to storage (prevents data loss)"
                        >
                            <SaveIcon className="mr-2 h-4 w-4" />
                            Save & Commit
                        </Button>
                    </>
                )}
            </div>
        </form>
    );
}
