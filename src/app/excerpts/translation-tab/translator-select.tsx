'use client';

import { useCallback, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TRANSLATION_MODELS } from '@/lib/constants';

const STORAGE_KEY = 'translation-model';

/** Get saved model from sessionStorage, falling back to first model */
export const getSavedModel = (): string => {
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

type TranslatorSelectProps = {
    /** Default value for uncontrolled mode */
    defaultValue?: string;
    /** Label text (optional, defaults to "Model:") */
    label?: string;
    /** Name attribute for form submission (uncontrolled mode) */
    name?: string;
    /** Callback when value changes */
    onChange?: (value: string) => void;
    /** Whether to persist selection to sessionStorage (default: true) */
    persist?: boolean;
    /** Controlled value (if not provided, uses internal state) */
    value?: string;
};

/**
 * Reusable translator/model selector component.
 * Uses a toggle group with color-coded options from TRANSLATION_MODELS.
 *
 * Supports both controlled and uncontrolled modes:
 * - Controlled: pass `value` and `onChange`
 * - Uncontrolled: pass `defaultValue` and `name` for form submission
 *
 * Persists selection to sessionStorage by default.
 */
export function TranslatorSelect({
    defaultValue,
    label = 'Model:',
    name,
    onChange,
    persist = true,
    value,
}: TranslatorSelectProps) {
    // For uncontrolled mode, we need internal state
    const [internalValue, setInternalValue] = useState<string>(() => defaultValue ?? getSavedModel());

    // Hidden input ref for uncontrolled form submission
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    // Use controlled value if provided, otherwise use internal state
    const currentValue = value ?? internalValue;

    const handleChange = useCallback(
        (newValue: string) => {
            if (!newValue) {
                return; // Ignore deselection
            }

            if (value === undefined) {
                // Uncontrolled mode - update internal state
                setInternalValue(newValue);
            }

            // Update hidden input for form submission
            if (hiddenInputRef.current) {
                hiddenInputRef.current.value = newValue;
            }

            if (persist) {
                sessionStorage.setItem(STORAGE_KEY, newValue);
            }

            onChange?.(newValue);
        },
        [value, persist, onChange],
    );

    return (
        <div className="flex items-center gap-4">
            {label && <Label>{label}</Label>}
            {/* Hidden input for form submission in uncontrolled mode */}
            {name && <input defaultValue={currentValue} name={name} ref={hiddenInputRef} type="hidden" />}
            <ToggleGroup onValueChange={handleChange} type="single" value={currentValue}>
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
    );
}

/** Get the numeric translator value from a string */
export const getTranslatorValue = (value: string): number => Number.parseInt(value, 10);
