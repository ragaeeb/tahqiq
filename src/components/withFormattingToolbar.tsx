import React, { forwardRef } from 'react';

import { useTextFormatter } from '@/hooks/useTextFormatter';

type TextInputElement = HTMLInputElement | HTMLTextAreaElement;

export const withFormattingToolbar = <P extends Record<string, any>>(Component: React.ComponentType<P>) => {
    const WrappedComponent = forwardRef<TextInputElement, P>((props, ref) => {
        const { handleBlur, handleFocus } = useTextFormatter();

        const handleFocusEvent = (e: React.FocusEvent<TextInputElement>) => {
            handleFocus(e);
            if (props.onFocus && typeof props.onFocus === 'function') {
                props.onFocus(e);
            }
        };

        const handleBlurEvent = (e: React.FocusEvent<TextInputElement>) => {
            handleBlur();
            if (props.onBlur && typeof props.onBlur === 'function') {
                props.onBlur(e);
            }
        };

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
