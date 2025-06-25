import { useCallback } from 'react';

import { type TextAreaElement, useToolbarStore } from '@/stores/useToolbarStore';

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
