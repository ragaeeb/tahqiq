import React, { useCallback } from 'react';

import { applyFormattingOnSelection, updateElementValue } from '@/lib/domUtils';
import { type TextAreaElement, type ToolbarAction, useToolbarStore } from '@/stores/useToolbarStore';

import { Button } from './ui/button';

type FormattingToolbarProps = {
    actions?: ToolbarAction[];
    className?: string;
    onChange?: (e: React.ChangeEvent<TextAreaElement>) => void;
};

const defaultActions: ToolbarAction[] = [
    {
        formatter: (text: string) => text.replace(/\d/g, ''),
        id: 'removeNumbers',
        label: '1̶2̶3̶',
    },
];

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
    actions = defaultActions,
    className = '',
    onChange,
}) => {
    const { toolbarState } = useToolbarStore();
    const { activeElement, isVisible, position } = toolbarState;

    const handleAction = useCallback(
        (action: ToolbarAction) => {
            if (!activeElement) {
                console.warn('No active element found for formatting');
                return;
            }

            const newValue = applyFormattingOnSelection(activeElement, action.formatter);
            updateElementValue(activeElement, newValue, onChange);

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
            {actions.map((action) => (
                <Button key={action.id} onClick={() => handleAction(action)}>
                    {action.label}
                </Button>
            ))}
        </div>
    );
};
