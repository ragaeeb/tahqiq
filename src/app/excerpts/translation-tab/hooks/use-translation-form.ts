import { useCallback, useMemo, useRef, useState } from 'react';
import { normalizeTranslationText, type ValidationError, validateTranslationResponse } from 'wobble-bibble';
import { filterNoisyError } from '@/lib/errorUtils';
import { errorsToHighlights } from '@/lib/segmentation';

interface UseTranslationFormProps {
    untranslated: { id: string; text: string }[];
    translatedIds: Set<string>;
    setPendingOverwrites: (val: { duplicates: string[]; overwrites: string[] } | null) => void;
}

/**
 * Hook for managing translation form state.
 * No longer manages selectedModel state internally.
 */
export function useTranslationForm({ untranslated, translatedIds, setPendingOverwrites }: UseTranslationFormProps) {
    const [textValue, setTextValue] = useState('');
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

    const justPastedRef = useRef(false);

    const highlights = useMemo(() => errorsToHighlights(validationErrors), [validationErrors]);

    const handlePaste = useCallback(
        (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
            const pastedText = e.clipboardData.getData('text');

            if (!pastedText.trim()) {
                return;
            }

            justPastedRef.current = true;
            setTimeout(() => {
                justPastedRef.current = false;
            }, 100);

            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;

            const normalizedPaste = normalizeTranslationText(pastedText);
            const fullContentAfterPaste = textValue.slice(0, start) + normalizedPaste + textValue.slice(end);

            const result = validateTranslationResponse(untranslated, fullContentAfterPaste);

            // Post-process errors to identify ones that are actually just already translated
            const processedErrors = result.errors.filter(filterNoisyError).map((err) => {
                if (err.type === 'invented_id' && err.id && translatedIds.has(err.id)) {
                    return { ...err, message: `Already Translated: "${err.id}" - this ID has already been translated` };
                }
                return err;
            });

            setValidationErrors(processedErrors);

            e.preventDefault();
            setTextValue(fullContentAfterPaste);
        },
        [untranslated, textValue, translatedIds],
    );

    const handleChange = useCallback(
        (newValue: string) => {
            // Don't clear error if we just pasted (paste also triggers onChange)
            if (justPastedRef.current) {
                return;
            }

            setTextValue(newValue);

            if (validationErrors.length) {
                setValidationErrors([]);
            }
            // We can't easily check pendingOverwrites here without passing it in or the setter
            // But we passed the setter, so we assume the caller wants us to clear it on change
            setPendingOverwrites(null);
        },
        [validationErrors.length, setPendingOverwrites],
    );

    return { handleChange, handlePaste, highlights, setTextValue, setValidationErrors, textValue, validationErrors };
}
