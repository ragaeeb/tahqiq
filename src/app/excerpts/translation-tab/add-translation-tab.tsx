'use client';

import { DyeLight } from 'dyelight';
import { SaveIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { TranslationModel } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useCorpusSnapshot } from './hooks/use-corpus-snapshot';
import { useInspector } from './hooks/use-inspector';
import { useTranslationForm } from './hooks/use-translation-form';
import { useTranslationSubmit } from './hooks/use-translation-submit';
import { InspectorSheet } from './inspector-sheet';
import { PendingOverwritesWarning } from './pending-overwrites-warning';
import { ValidationErrors } from './validation-errors';

// ...

interface AddTranslationTabProps {
    model: TranslationModel;
}

export function AddTranslationTab({ model }: AddTranslationTabProps) {
    const { untranslated, translatedIds } = useCorpusSnapshot();

    // Shared state for pending overwrites
    const [pendingOverwrites, setPendingOverwrites] = useState<{ duplicates: string[]; overwrites: string[] } | null>(
        null,
    );

    const { textValue, setTextValue, validationErrors, setValidationErrors, highlights, handlePaste, handleChange } =
        useTranslationForm({ setPendingOverwrites, untranslated });

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

    // Derived validation error text for rendering conditional borders
    const hasErrors = validationErrors.length > 0;

    return (
        <form className="flex min-h-0 flex-1 flex-col gap-4 p-4" onSubmit={handleSubmit}>
            {/* Model select moved to parent */}

            <div className="flex min-h-0 flex-1 flex-col gap-2">
                <Label htmlFor="translations">Translations:</Label>
                <DyeLight
                    containerClassName={cn(
                        'min-h-0 flex-1 rounded-md border border-input bg-background shadow-xs transition-[color,box-shadow]',
                        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
                        'font-sans text-base',
                        hasErrors && 'border-destructive ring-destructive/20',
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

                <ValidationErrors
                    errors={validationErrors}
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
                    <PendingOverwritesWarning
                        duplicates={pendingOverwrites.duplicates}
                        overwrites={pendingOverwrites.overwrites}
                    />
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
