'use client';

import { DyeLight } from 'dyelight';
import { BugIcon, DownloadIcon, SaveIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { fixAll, type ValidationErrorType } from 'wobble-bibble';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { TranslationModel } from '@/lib/constants';
import { downloadFile } from '@/lib/domUtils';
import { buildCorpusSnapshot } from '@/lib/segmentation';
import { cn } from '@/lib/utils';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import { useInspector } from './hooks/use-inspector';
import { useTranslationForm } from './hooks/use-translation-form';
import { useTranslationSubmit } from './hooks/use-translation-submit';
import { InspectorSheet } from './inspector-sheet';
import { ValidationErrors } from './validation-errors';

interface AddTranslationTabProps {
    model: TranslationModel;
}

type PendingOverwrites = { duplicates: string[]; overwrites: string[] };

export function AddTranslationTab({ model }: AddTranslationTabProps) {
    const excerpts = useExcerptsStore((state) => state.excerpts);
    const headings = useExcerptsStore((state) => state.headings);
    const footnotes = useExcerptsStore((state) => state.footnotes);

    const { untranslated, translatedIds } = useMemo(
        () => buildCorpusSnapshot(excerpts, headings, footnotes),
        [excerpts, headings, footnotes],
    );

    // Shared state for pending overwrites
    const [pendingOverwrites, setPendingOverwrites] = useState<PendingOverwrites | null>(null);
    const [isDebugMode, setIsDebugMode] = useState(false);

    const { textValue, setTextValue, validationErrors, setValidationErrors, highlights, handlePaste, handleChange } =
        useTranslationForm({ setPendingOverwrites, translatedIds, untranslated });

    const { inspectorSegmentId, setInspectorSegmentId, inspectSegment, dyeLightRef } = useInspector();

    const inspectorSegment = useMemo(
        () => untranslated.find((s) => s.id === inspectorSegmentId),
        [untranslated, inspectorSegmentId],
    );

    const { submitTranslations } = useTranslationSubmit({
        dyeLightRef,
        pendingOverwrites,
        selectedModel: model.value,
        setPendingOverwrites,
        setTextValue,
        setValidationErrors,
        textValue,
        translatedIds,
        untranslated,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitTranslations(false);
    };

    const handleSaveAndCommit = async (e: React.MouseEvent) => {
        e.preventDefault();
        await submitTranslations(true);
    };

    const handleFix = (type: ValidationErrorType) => {
        const result = fixAll(textValue, { types: [type] });
        if (result.text !== textValue) {
            setTextValue(result.text);
            const count = result.applied.length;
            toast.success(`Fixed ${count} issues`, { description: `Applied fixes for ${type}` });
        } else {
            toast.info('No changes could be applied automatically');
        }
    };

    // Derived validation error text for rendering conditional borders
    const hasErrors = validationErrors.length > 0;

    return (
        <form className="flex min-h-0 flex-1 flex-col gap-4 p-4" onSubmit={handleSubmit}>
            {/* Model select moved to parent */}

            <div className="flex min-h-0 flex-1 flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="translations">Translations:</Label>
                    <div className="flex items-center gap-2">
                        {isDebugMode && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const report = dyeLightRef.current?.exportForAI();
                                    if (report) {
                                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                                        downloadFile(`dyelight-debug-${timestamp}.json`, report);
                                        toast.success('Debug report downloaded');
                                    } else {
                                        toast.info('No debug data available yet');
                                    }
                                }}
                                title="Download debug report for AI analysis"
                            >
                                <DownloadIcon className="mr-1 h-3 w-3" />
                                Export Debug
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant={isDebugMode ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setIsDebugMode(!isDebugMode)}
                            title={isDebugMode ? 'Disable debug mode' : 'Enable debug mode for troubleshooting'}
                            className={isDebugMode ? 'bg-orange-500 hover:bg-orange-600' : ''}
                        >
                            <BugIcon className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
                <DyeLight
                    containerClassName={cn(
                        'min-h-0 flex-1 rounded-md border border-input bg-background shadow-xs transition-[color,box-shadow]',
                        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
                        'font-sans text-base',
                        hasErrors && 'border-destructive ring-destructive/20',
                    )}
                    className="h-full min-h-0 flex-1 resize-none bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground"
                    debug={isDebugMode}
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

                <ValidationErrors
                    errors={validationErrors}
                    onFix={handleFix}
                    onInspect={inspectSegment}
                    selectedModel={model}
                    textValue={textValue}
                />

                <InspectorSheet
                    segmentId={inspectorSegmentId}
                    segmentText={inspectorSegment?.text}
                    onClose={() => setInspectorSegmentId(null)}
                />

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
