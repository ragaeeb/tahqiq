'use client';

import type { DyeLightRef } from 'dyelight';
import { record } from 'nanolytics';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { parseTranslations, validateTranslationResponse } from 'wobble-bibble';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import { getTranslatorValue } from '../translator-select';

interface UseTranslationSubmitProps {
    textValue: string;
    setTextValue: (val: string) => void;
    untranslated: { id: string; text: string }[];
    translatedIds: Set<string>;
    selectedModel: string;
    setValidationErrors: (errors: any[]) => void;
    dyeLightRef: React.RefObject<DyeLightRef | null>;
    pendingOverwrites: { duplicates: string[]; overwrites: string[] } | null;
    setPendingOverwrites: (val: { duplicates: string[]; overwrites: string[] } | null) => void;
}

export function useTranslationSubmit({
    textValue,
    setTextValue,
    untranslated,
    translatedIds,
    selectedModel,
    setValidationErrors,
    dyeLightRef,
    pendingOverwrites,
    setPendingOverwrites,
}: UseTranslationSubmitProps) {
    const applyBulkTranslations = useExcerptsStore((state) => state.applyBulkTranslations);

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

            let message: string;
            let isWarning = false;

            if (updated < total) {
                message = `Updated ${updated} of ${total} translations`;
                isWarning = true;
            } else {
                message = `Updated ${updated} translations`;
            }

            if (shouldCommit) {
                const success = await handleCommit();
                if (success) {
                    message += ' & committed';
                } else {
                    toast.error('Translations saved but failed to commit to storage');
                    return;
                }
            }

            if (isWarning) {
                toast.warning(message);
            } else {
                toast.success(message);
            }

            setTextValue('');
            dyeLightRef.current?.focus();
            setValidationErrors([]);
            setPendingOverwrites(null); // Clear pending overwrites on success
        },
        [applyBulkTranslations, handleCommit, setTextValue, dyeLightRef, setValidationErrors, setPendingOverwrites],
    );

    const submitTranslations = useCallback(
        async (shouldCommit = false) => {
            const rawText = textValue.trim();

            if (!rawText) {
                if (shouldCommit) {
                    const success = await handleCommit();
                    if (success) {
                        toast.success('Committed current state to storage');
                    } else {
                        toast.error('Failed to commit to storage');
                    }
                } else {
                    toast.error('Please enter some translations');
                }
                return;
            }

            const { errors, normalizedResponse } = validateTranslationResponse(untranslated, rawText);
            setValidationErrors(errors);

            const { translationMap, count } = parseTranslations(normalizedResponse);
            if (count === 0) {
                toast.error('No valid translations found. Format: ID - Translation text');
                return;
            }

            const overwrites = Array.from(translationMap.keys()).filter((id) => translatedIds.has(id));
            if (overwrites.length > 0 && !pendingOverwrites) {
                setPendingOverwrites({ duplicates: [], overwrites });
                return;
            }

            setPendingOverwrites(null);
            doSubmit(translationMap, getTranslatorValue(selectedModel), count, shouldCommit);
        },
        [
            textValue,
            untranslated,
            selectedModel,
            translatedIds,
            pendingOverwrites,
            doSubmit,
            handleCommit,
            setValidationErrors,
            setPendingOverwrites,
        ],
    );

    return { handleCommit, submitTranslations };
}
