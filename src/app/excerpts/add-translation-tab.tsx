'use client';

import { FileWarningIcon, SaveIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { normalizeTranslationText, parseTranslations, validateTranslationResponse } from 'wobble-bibble';

import { Button } from '@/components/ui/button';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TRANSLATION_MODELS } from '@/lib/constants';
import {
    buildExistingTranslationsMap,
    buildValidationSegments,
    formatValidationErrors,
    type ValidationErrorInfo,
} from '@/lib/segmentation';
import { cn } from '@/lib/utils';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import { getTranslatorValue, TranslatorSelect } from './translator-select';
import { ValidationReportDialog } from './validation-report-dialog';

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
    const [validationErrors, setValidationErrors] = useState<ValidationErrorInfo[]>([]);
    const [pendingOverwrites, setPendingOverwrites] = useState<{ duplicates: string[]; overwrites: string[] } | null>(
        null,
    );

    const applyBulkTranslations = useExcerptsStore((state) => state.applyBulkTranslations);
    const excerpts = useExcerptsStore((state) => state.excerpts);
    const headings = useExcerptsStore((state) => state.headings);
    const footnotes = useExcerptsStore((state) => state.footnotes);

    // Build segments array for wobble-bibble validation (maps nass -> text)
    const segments = useMemo(
        () => buildValidationSegments(excerpts, headings, footnotes),
        [excerpts, headings, footnotes],
    );

    // Build map of IDs that already have translations
    const existingTranslations = useMemo(
        () => buildExistingTranslationsMap(excerpts, headings, footnotes),
        [excerpts, headings, footnotes],
    );

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

            const textarea = textareaRef.current;
            if (!textarea) {
                return;
            }

            // Calculate the full content AFTER the paste is applied
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentValue = textarea.value;

            // Normalize the pasted text first
            const normalizedPaste = normalizeTranslationText(pastedText);
            const fullContentAfterPaste = currentValue.slice(0, start) + normalizedPaste + currentValue.slice(end);

            // Validate the FULL content using wobble-bibble
            const result = validateTranslationResponse(segments, fullContentAfterPaste);

            if (result.errors.length > 0) {
                setValidationErrors(result.errors);
                setValidationError(formatValidationErrors(result.errors));
            } else {
                setValidationErrors([]);
                setValidationError(undefined);
            }

            // If text was normalized (merged markers split), update the textarea manually
            if (normalizedPaste !== pastedText) {
                e.preventDefault();
                textarea.value = fullContentAfterPaste;
                // Set cursor position after pasted text
                const newPosition = start + normalizedPaste.length;
                textarea.setSelectionRange(newPosition, newPosition);
            }
        },
        [segments],
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

    const handleCommit = useCallback(async () => {
        const success = await useExcerptsStore.getState().save();
        if (success) {
            record('CommitTranslationsToStorage');
            return true;
        }
        return false;
    }, []);

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
                const success = await handleCommit();
                if (success) {
                    message += ' & committed';
                } else {
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

            // Clear validation errors after successful save
            setValidationError(undefined);
            setValidationErrors([]);
        },
        [applyBulkTranslations, handleCommit],
    );

    const submitTranslations = useCallback(
        async (shouldCommit = false) => {
            const rawText = textareaRef.current?.value || '';

            if (!rawText.trim()) {
                if (shouldCommit) {
                    const success = await handleCommit();
                    if (success) {
                        toast.success('Committed current state to storage');
                    } else {
                        toast.error('Failed to commit to storage');
                    }
                    return;
                }
                toast.error('Please enter some translations');
                return;
            }

            // Validate using wobble-bibble (warn but don't block)
            const validation = validateTranslationResponse(segments, rawText);

            if (validation.errors.length > 0) {
                setValidationErrors(validation.errors);
                const errorMessage = formatValidationErrors(validation.errors);
                setValidationError(errorMessage);
                // Show warning but continue with save
            }

            const { translationMap, count } = parseTranslations(validation.normalizedResponse);

            if (count === 0) {
                toast.error('No valid translations found. Format: ID - Translation text');
                return;
            }

            // Check for overwrites of existing translations (wobble-bibble checks duplicates in response)
            const overwrites: string[] = [];
            for (const id of translationMap.keys()) {
                if (existingTranslations.has(id)) {
                    overwrites.push(id);
                }
            }

            const translatorValue = getTranslatorValue(selectedModel);

            // Show confirmation for overwrites
            if (overwrites.length > 0 && !pendingOverwrites) {
                setPendingOverwrites({ duplicates: [], overwrites });
                return;
            }

            // Either no issues or user confirmed
            setPendingOverwrites(null);
            doSubmit(translationMap, translatorValue, count, shouldCommit);
        },
        [segments, selectedModel, existingTranslations, pendingOverwrites, doSubmit, handleCommit],
    );

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            await submitTranslations(false);
        },
        [submitTranslations],
    );

    const handleSaveAndCommit = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault();
            await submitTranslations(true);
        },
        [submitTranslations],
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
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 whitespace-pre-wrap">⚠️ {validationError}</div>
                            <DialogTriggerButton
                                className="shrink-0"
                                renderContent={(close) => {
                                    const model = TRANSLATION_MODELS.find((m) => m.value === selectedModel);
                                    const modelName = (model?.label || 'unknown').replace(/\s+/g, '_');
                                    const firstId = validationErrors[0]?.id || 'unknown';
                                    return (
                                        <ValidationReportDialog
                                            defaultErrors={validationError}
                                            defaultFileName={`${modelName}_${firstId}`}
                                            defaultModel={selectedModel}
                                            defaultResponse={textareaRef.current?.value || ''}
                                            onClose={close}
                                        />
                                    );
                                }}
                                size="sm"
                                type="button"
                                variant="outline"
                            >
                                <FileWarningIcon className="mr-1 h-3 w-3" />
                                Create Report
                            </DialogTriggerButton>
                        </div>
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
                        <Button type="submit">Save Translations</Button>
                        <Button
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
