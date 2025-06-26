import React, { useCallback } from 'react';

import { updateElementValue } from '@/lib/domUtils';
import { type TextAreaElement, useToolbarStore } from '@/stores/useToolbarStore';

type ApplyFormatCallback = (formatter: (text: string) => string) => void;

type FormattingToolbarProps = {
    children: (applyFormat: ApplyFormatCallback) => React.ReactNode;
    className?: string;
    onChange?: (e: React.ChangeEvent<TextAreaElement>) => void;
};

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ children, className = '', onChange }) => {
    const { toolbarState } = useToolbarStore();
    const { activeElement, isVisible, position } = toolbarState;

    const applyFormat = useCallback(
        (formatter: (text: string) => string) => {
            if (!activeElement) {
                console.warn('No active element found for formatting');
                return;
            }

            // Get current selection or entire text
            const selectionStart = activeElement.selectionStart ?? 0;
            const selectionEnd = activeElement.selectionEnd ?? 0;
            const fullText = activeElement.value;

            // Use selected text if there's a selection, otherwise use full text
            const textToFormat =
                selectionStart !== selectionEnd ? fullText.substring(selectionStart, selectionEnd) : fullText;

            // Call the formatter with the text and get formatted result
            const formattedText = formatter(textToFormat);

            // Update the element with the formatted text
            if (selectionStart !== selectionEnd) {
                // Replace selected text
                const newValue =
                    fullText.substring(0, selectionStart) + formattedText + fullText.substring(selectionEnd);
                updateElementValue(activeElement, newValue, onChange);
            } else {
                // Replace entire text
                updateElementValue(activeElement, formattedText, onChange);
            }

            // Keep focus on the element after formatting
            activeElement.focus();
        },
        [activeElement, onChange],
    );

    if (!isVisible || !position) {
        return null;
    }

    return (
        <div
            className={`fixed z-50 bg-white border border-gray-300 rounded-md shadow-lg p-1 flex gap-1 ${className}`}
            onMouseDown={(e) => {
                // Prevent blur event when clicking toolbar
                e.preventDefault();
            }}
            style={{
                left: position.x,
                top: position.y,
            }}
        >
            {children(applyFormat)}
        </div>
    );
};
