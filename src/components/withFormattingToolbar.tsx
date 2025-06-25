import React, { forwardRef } from 'react';

import { useTextFormatter } from '@/hooks/useTextFormatter';

type TextInputElement = HTMLInputElement | HTMLTextAreaElement;

type WithFormattingToolbarProps = {
    onBlur?: (e: React.FocusEvent<TextInputElement>) => void;
    onFocus?: (e: React.FocusEvent<TextInputElement>) => void;
};

export const withFormattingToolbar = <P extends WithFormattingToolbarProps>(Component: React.ComponentType<P>) => {
    const WrappedComponent = forwardRef<TextInputElement, P>((props, ref) => {
        const { handleBlur, handleFocus } = useTextFormatter();

        const handleFocusEvent = (e: React.FocusEvent<TextInputElement>) => {
            handleFocus(e);
            props.onFocus?.(e);
        };

        const handleBlurEvent = (e: React.FocusEvent<TextInputElement>) => {
            handleBlur();
            props.onBlur?.(e);
        };

        // Use React.createElement to avoid prop spreading issues
        return React.createElement(Component, {
            ...props,
            onBlur: handleBlurEvent,
            onFocus: handleFocusEvent,
            ref,
        } as P & { ref: React.ForwardedRef<TextInputElement> });
    });

    WrappedComponent.displayName = `withFormattingToolbar(${Component.displayName || Component.name})`;

    return WrappedComponent;
};
