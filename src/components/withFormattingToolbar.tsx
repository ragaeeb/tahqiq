import React, { forwardRef } from 'react';

import { useTextFormatter } from '@/hooks/useTextFormatter';

type TextInputElement = HTMLInputElement | HTMLTextAreaElement;

// Generic approach that preserves all original component props
export const withFormattingToolbar = <P extends Record<string, any>>(Component: React.ComponentType<P>) => {
    const WrappedComponent = forwardRef<TextInputElement, P>((props, ref) => {
        const { handleBlur, handleFocus } = useTextFormatter();

        const handleFocusEvent = (e: React.FocusEvent<TextInputElement>) => {
            handleFocus(e);
            // Call original onFocus if it exists
            if ('onFocus' in props && typeof props.onFocus === 'function') {
                props.onFocus(e);
            }
        };

        const handleBlurEvent = (e: React.FocusEvent<TextInputElement>) => {
            handleBlur();
            // Call original onBlur if it exists
            if ('onBlur' in props && typeof props.onBlur === 'function') {
                props.onBlur(e);
            }
        };

        // Create enhanced props with our handlers
        const enhancedProps = {
            ...props,
            onBlur: handleBlurEvent,
            onFocus: handleFocusEvent,
            ref,
        } as P & { ref: React.ForwardedRef<TextInputElement> };

        return React.createElement(Component, enhancedProps);
    });

    WrappedComponent.displayName = `withFormattingToolbar(${Component.displayName || Component.name})`;

    return WrappedComponent;
};
