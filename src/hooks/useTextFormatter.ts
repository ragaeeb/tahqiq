import { useCallback, useRef } from 'react';

import { type TextAreaElement, useToolbarStore } from '@/stores/useToolbarStore';

const BLUR_DELAY = 500;

export const useTextFormatter = () => {
    const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { clearToolbar, setToolbarVisible } = useToolbarStore();

    const handleFocus = useCallback(
        (e: React.FocusEvent<TextAreaElement>) => {
            // Clear any pending blur timeout
            if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
                blurTimeoutRef.current = null;
            }

            setToolbarVisible(true, e.target);
        },
        [setToolbarVisible],
    );

    const handleBlur = useCallback(() => {
        // Delay hiding toolbar to allow clicking on toolbar buttons
        blurTimeoutRef.current = setTimeout(() => {
            clearToolbar();
            blurTimeoutRef.current = null;
        }, BLUR_DELAY);
    }, [clearToolbar]);

    return { handleBlur, handleFocus };
};
