import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Renders a styled textarea element with customizable classes and all standard textarea props.
 *
 * Combines default utility classes for consistent appearance, focus, invalid, and disabled states, while allowing additional custom classes via the {@link className} prop.
 *
 * @param className - Additional CSS classes to apply to the textarea.
 * @returns A React textarea element with merged styling and props.
 */
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
    return (
        <textarea
            className={cn(
                [
                    'border-input placeholder:text-muted-foreground',
                    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                    'dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent',
                    'px-3 py-2 shadow-xs transition-[color,box-shadow] outline-none',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                ].join(' '),
                className,
            )}
            data-slot="textarea"
            {...props}
        />
    );
}

export { Textarea };
