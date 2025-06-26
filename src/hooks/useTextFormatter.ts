import { useCallback } from 'react';

import { type TextAreaElement, useToolbarStore } from '@/stores/useToolbarStore';

/**
 * Custom hook for handling text formatter toolbar visibility on focus/blur events
 * @returns Object containing handleFocus and handleBlur event handlers
 */
export const useTextFormatter = () => {
    const { cancelScheduledHide, scheduleHide, setToolbarVisible } = useToolbarStore();

    const handleFocus = useCallback(
        (e: React.FocusEvent<TextAreaElement>) => {
            // Cancel any pending hide and show toolbar immediately
            cancelScheduledHide();
            setToolbarVisible(true, e.target);
        },
        [setToolbarVisible, cancelScheduledHide],
    );

    const handleBlur = useCallback(() => {
        // Schedule hide with delay
        scheduleHide();
    }, [scheduleHide]);

    return { handleBlur, handleFocus };
};
