'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

type ClickToRevealProps = {
    /**
     * Blur intensity (in pixels)
     * @default "3px"
     */
    blurAmount?: string;
    /**
     * Optional className for the container
     */
    className?: string;
    /**
     * The sensitive content to be revealed
     */
    defaultValue?: string;
    /**
     * Custom label text for the reveal button
     * @default "Click to Reveal"
     */
    label?: string;
    /**
     * Callback when the input value changes
     */
    onSubmit: (value: string) => void;
    /**
     * Placeholder text for the input
     */
    placeholder?: string;
    /**
     * Whether the input is readonly when revealed
     * @default false
     */
    readOnly?: boolean;
};

/**
 * A component that displays sensitive content with a blur effect and a button to reveal it.
 * The content is not editable until revealed.
 */
export function ClickToReveal({
    blurAmount = '3px',
    className,
    defaultValue = '',
    label = 'Click to Reveal',
    onSubmit,
    placeholder,
    readOnly = false,
    ...props
}: ClickToRevealProps) {
    const [isRevealed, setIsRevealed] = React.useState(false);

    const handleReveal = () => {
        setIsRevealed(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onSubmit(e.target.value);
    };

    return (
        <fieldset
            className={cn(
                'relative px-3 py-2 text-sm font-medium w-full text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-md',
                className,
            )}
            {...props}
        >
            {!isRevealed && (
                <Button
                    className={cn(
                        'inline-block absolute px-2 py-0.5 border border-slate-200 dark:border-slate-800 rounded-sm ring-2 ring-offset-0 ring-white/60 dark:ring-slate-900/60 z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors',
                    )}
                    onClick={handleReveal}
                    variant="outline"
                >
                    {label}
                </Button>
            )}

            <Textarea
                className={cn(
                    'transition-all duration-200 border-0 shadow-none px-0 h-auto bg-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus:border-transparent focus-visible:border-transparent text-xs',
                    !isRevealed && 'blur-[var(--blur-amount)] pointer-events-none select-none',
                )}
                defaultValue={defaultValue}
                name="sensitive-input"
                onBlur={handleInputChange}
                placeholder={placeholder}
                readOnly={readOnly}
                style={
                    {
                        '--blur-amount': blurAmount,
                    } as React.CSSProperties
                }
                tabIndex={isRevealed ? 0 : -1}
            />
        </fieldset>
    );
}
