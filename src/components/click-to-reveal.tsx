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
                'relative w-full rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-800 text-sm dark:border-slate-800 dark:text-slate-200',
                className,
            )}
            {...props}
        >
            {!isRevealed && (
                <Button
                    className={cn(
                        'absolute top-1/2 left-1/2 z-10 inline-block -translate-x-1/2 -translate-y-1/2 rounded-sm border border-slate-200 px-2 py-0.5 ring-2 ring-white/60 ring-offset-0 transition-colors hover:border-slate-300 dark:border-slate-800 dark:ring-slate-900/60 dark:hover:border-slate-700',
                    )}
                    onClick={handleReveal}
                    variant="outline"
                >
                    {label}
                </Button>
            )}

            <Textarea
                className={cn(
                    'h-auto border-0 bg-transparent px-0 text-xs shadow-none transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-0 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0',
                    !isRevealed && 'pointer-events-none select-none blur-[var(--blur-amount)]',
                )}
                defaultValue={defaultValue}
                name="sensitive-input"
                onBlur={handleInputChange}
                placeholder={placeholder}
                readOnly={readOnly}
                style={{ '--blur-amount': blurAmount } as React.CSSProperties}
                tabIndex={isRevealed ? 0 : -1}
            />
        </fieldset>
    );
}
