'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ClickToRevealProps {
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
     * Whether the input is readonly
     * @default false
     */
    readOnly?: boolean;
}

/**
 * A component that displays sensitive content with a blur effect and a button to reveal it.
 * Uses the peer modifier pattern with Tailwind CSS to toggle visibility without JavaScript state.
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
    const toggleId = React.useId();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const value = (data.get('sensitive-input') as string)?.trim() || '';
        onSubmit(value);
    };

    return (
        <form onSubmit={handleSubmit}>
            <fieldset
                className={cn(
                    'relative px-3 py-2 text-sm font-medium w-full text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-md',
                    className,
                )}
                {...props}
            >
                <input className="peer/toggle hidden" id={toggleId} type="checkbox" />

                <Label
                    className={cn(
                        'inline-block absolute px-2 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm ring-2 ring-offset-0 ring-white/60 dark:ring-slate-900/60 z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors peer-checked/toggle:hidden',
                    )}
                    htmlFor={toggleId}
                >
                    {label}
                </Label>

                <Input
                    className={cn(
                        'blur-[var(--blur-amount)] peer-checked/toggle:blur-none transition-all duration-200 border-0 shadow-none px-0 h-auto bg-transparent',
                    )}
                    defaultValue={defaultValue}
                    name="sensitive-input"
                    placeholder={placeholder}
                    readOnly={readOnly}
                    style={
                        {
                            '--blur-amount': blurAmount,
                        } as React.CSSProperties
                    }
                />
            </fieldset>
        </form>
    );
}
