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
            handleBlur(e);
            props.onBlur?.(e);
        };

        return <Component {...props} onBlur={handleBlurEvent} onFocus={handleFocusEvent} ref={ref} />;
    });

    WrappedComponent.displayName = `withFormattingToolbar(${Component.displayName || Component.name})`;

    return WrappedComponent;
};
