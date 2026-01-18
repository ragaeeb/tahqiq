'use client';

import { DyeLight, type DyeLightRef } from 'dyelight';
import { EyeIcon, FileWarningIcon, SaveIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { normalizeTranslationText, parseTranslations, validateTranslationResponse } from 'wobble-bibble';
import { Button } from '@/components/ui/button';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { TRANSLATION_MODELS } from '@/lib/constants';
import {
    buildExistingTranslationsMap,
    buildValidationSegments,
    errorsToHighlights,
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
    const [textValue, setTextValue] = useState('');
    const dyeLightRef = useRef<DyeLightRef>(null);
    const [selectedModel, setSelectedModel] = useState<string>(getSavedModel());
    const [validationError, setValidationError] = useState<string | undefined>();
    const [validationErrors, setValidationErrors] = useState<ValidationErrorInfo[]>([]);
    const [pendingOverwrites, setPendingOverwrites] = useState<{ duplicates: string[]; overwrites: string[] } | null>(
        null,
    );
    const [inspectorSegmentId, setInspectorSegmentId] = useState<string | null>(null);

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

    const inspectorSegment = useMemo(
        () => segments.find((s) => s.id === inspectorSegmentId),
        [segments, inspectorSegmentId],
    );

    // Track if we just pasted to avoid clearing the error (paste triggers onChange)
    const justPastedRef = useRef(false);

    // Compute highlights from validation errors for DyeLight
    const highlights = useMemo(() => errorsToHighlights(validationErrors), [validationErrors]);

    const handlePaste = useCallback(
        (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
            const pastedText = e.clipboardData.getData('text');

            if (!pastedText.trim()) {
                return;
            }

            justPastedRef.current = true;
            // Reset after a short delay
            setTimeout(() => {
                justPastedRef.current = false;
            }, 100);

            // We need to get selection from the underlying textarea
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;

            // Normalize the pasted text first
            const normalizedPaste = normalizeTranslationText(pastedText);
            const fullContentAfterPaste = textValue.slice(0, start) + normalizedPaste + textValue.slice(end);

            // Validate the FULL content using wobble-bibble
            const result = validateTranslationResponse(segments, fullContentAfterPaste);

            if (result.errors.length > 0) {
                setValidationErrors(result.errors as ValidationErrorInfo[]);
                setValidationError(formatValidationErrors(result.errors as ValidationErrorInfo[]));
            } else {
                setValidationErrors([]);
                setValidationError(undefined);
            }

            // Always prevent default and update controlled state with normalized content
            e.preventDefault();
            setTextValue(fullContentAfterPaste);
        },
        [segments, textValue],
    );

    const handleChange = useCallback(
        (newValue: string) => {
            setTextValue(newValue);

            // Don't clear error if we just pasted (paste also triggers onChange)
            if (justPastedRef.current) {
                return;
            }
            // Clear validation error when user manually edits
            if (validationError) {
                setValidationError(undefined);
                setValidationErrors([]);
            }
            // Clear pending overwrites when user edits
            if (pendingOverwrites) {
                setPendingOverwrites(null);
            }
        },
        [validationError, pendingOverwrites],
    );

    const inspectSegment = useCallback((e: React.MouseEvent, id: string, range?: { start: number; end: number }) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('[AddTranslationTab] inspectSegment called:', { id, range });
        setInspectorSegmentId(id);

        // We use a slight delay to allow the drawer to start opening
        // and avoid layout collisions with focus/scroll.
        setTimeout(() => {
            if (range && dyeLightRef.current) {
                const textarea = document.getElementById('translations') as HTMLTextAreaElement;
                if (textarea) {
                    // Check if smooth scroll is supported and preferred
                    const behavior = window.matchMedia('(prefers-reduced-motion: no-preference)').matches
                        ? 'smooth'
                        : 'auto';

                    // Use the more accurate DOM-based scrolling from DyeLight
                    dyeLightRef.current.scrollToPosition(range.start, 60, behavior);

                    // Re-apply after a delay to ensure it sticks during drawer animation
                    setTimeout(() => {
                        if (dyeLightRef.current) {
                            dyeLightRef.current.scrollToPosition(range.start, 60, behavior);
                        }
                    }, 300);
                }
            }
        }, 50);
    }, []);

    useEffect(() => {
        const textarea = document.getElementById('translations');
        if (textarea) {
            const handleManualScroll = () => {
                if (textarea.scrollTop > 0) {
                    // console.log('[translations scroll] scrollTop:', textarea.scrollTop);
                }
                if (textarea.scrollTop === 0 && !!inspectorSegmentId) {
                    console.warn('[translations scroll] RESET TO 0 while inspector is active!');
                }
            };
            textarea.addEventListener('scroll', handleManualScroll);
            return () => textarea.removeEventListener('scroll', handleManualScroll);
        }
    }, [inspectorSegmentId]);

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

            // Clear textarea and focus
            setTextValue('');
            dyeLightRef.current?.focus();

            // Clear validation errors after successful save
            setValidationError(undefined);
            setValidationErrors([]);
        },
        [applyBulkTranslations, handleCommit],
    );

    const submitTranslations = useCallback(
        async (shouldCommit = false) => {
            const rawText = textValue;

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
                setValidationErrors(validation.errors as ValidationErrorInfo[]);
                const errorMessage = formatValidationErrors(validation.errors as ValidationErrorInfo[]);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitTranslations(false);
    };

    const handleSaveAndCommit = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault();
            await submitTranslations(true);
        },
        [submitTranslations],
    );

    return (
        <form className="flex min-h-0 flex-1 flex-col gap-4 p-4" onSubmit={handleSubmit}>
            <TranslatorSelect onChange={setSelectedModel} value={selectedModel} />

            <div className="flex min-h-0 flex-1 flex-col gap-2">
                <Label htmlFor="translations">Translations:</Label>
                <DyeLight
                    containerClassName={cn(
                        'min-h-0 flex-1 rounded-md border border-input bg-background shadow-xs transition-[color,box-shadow]',
                        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
                        'font-sans text-base',
                        validationError && 'border-destructive ring-destructive/20',
                    )}
                    className="h-full min-h-0 flex-1 resize-none bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground"
                    enableAutoResize={false}
                    highlights={highlights}
                    id="translations"
                    onChange={handleChange}
                    onPaste={handlePaste}
                    placeholder={`P11622a - ʿImrān al-Qaṭṭān; he is Ibn Dāwar. It has preceded.
Another line that is for this excerpt.

C11623 - Those whose name is ʿUmayr and ʿUmayrah

Another line that should be appended to this existing excerpt.`}
                    ref={dyeLightRef}
                    value={textValue}
                />
                {validationErrors.length > 0 && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-red-700 text-sm">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-1 flex-col gap-0">
                                {(() => {
                                    // Group errors by message
                                    type GroupedError = {
                                        message: string;
                                        items: { id: string; range: { start: number; end: number } }[];
                                    };
                                    const groups = new Map<string, GroupedError>();
                                    for (const err of validationErrors) {
                                        const cleanMessage = err.message.replace(/ in "[^"]+"/, '').trim(); // Remove "in P123" suffix if present to group better
                                        const key = cleanMessage;
                                        const existing = groups.get(key) || { items: [], message: cleanMessage };

                                        // Avoid duplicate IDs in the same group (if multiple errors in same segment)
                                        const id = err.id || '?';
                                        if (!existing.items.some((item) => item.id === id)) {
                                            existing.items.push({ id, range: err.range });
                                        }
                                        groups.set(key, existing);
                                    }

                                    return Array.from(groups.values()).map((group, i) => (
                                        <div key={i.toString()} className="flex items-center gap-1 py-0">
                                            <span className="shrink-0 select-none text-red-500 text-xs">⚠</span>
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
                                                <div className="inline-flex items-center gap-0.5">
                                                    {group.items.map((item, j) => (
                                                        <Button
                                                            key={`${item.id}-${j.toString()}`}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 gap-1 rounded-sm px-1 font-mono text-[10px] text-red-700 hover:bg-red-200 hover:text-red-900"
                                                            onClick={(e) => inspectSegment(e, item.id, item.range)}
                                                            title={`View ${item.id}`}
                                                        >
                                                            <EyeIcon className="h-2.5 w-2.5 opacity-60" />
                                                            <span className="font-bold">{item.id}</span>
                                                        </Button>
                                                    ))}
                                                </div>
                                                <span className="text-red-800 text-xs leading-none">
                                                    {group.message}
                                                </span>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                            <DialogTriggerButton
                                className="shrink-0"
                                renderContent={(close) => {
                                    const model = TRANSLATION_MODELS.find((m) => m.value === selectedModel);
                                    const modelName = (model?.label || 'unknown').replace(/\s+/g, '_');
                                    const firstId = validationErrors[0]?.id || 'unknown';
                                    return (
                                        <ValidationReportDialog
                                            defaultErrors={validationError || ''}
                                            defaultFileName={`${modelName}_${firstId}`}
                                            defaultModel={selectedModel}
                                            defaultResponse={textValue}
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

                <Sheet
                    onOpenChange={(open) => {
                        console.log('[Sheet onOpenChange] open:', open);
                        if (!open) {
                            setInspectorSegmentId(null);
                        }
                    }}
                    open={!!inspectorSegmentId}
                    modal={false}
                >
                    <SheetContent
                        side="right"
                        className="sm:max-w-md"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        onInteractOutside={(e) => e.preventDefault()}
                    >
                        <SheetHeader>
                            <SheetTitle>Arabic Reference: {inspectorSegmentId}</SheetTitle>
                            <SheetDescription>
                                Compare the source text with your translation to resolve validation errors.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="mt-4 flex-1 overflow-y-auto px-4">
                            {inspectorSegment ? (
                                <div
                                    className="whitespace-pre-wrap rounded-lg bg-muted/30 p-4 font-arabic text-base leading-relaxed"
                                    dir="rtl"
                                >
                                    {inspectorSegment.text}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-muted-foreground">Segment not found</div>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
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
