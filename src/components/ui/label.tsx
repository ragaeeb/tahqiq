'use client';

import { Root } from '@radix-ui/react-label';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Renders a styled label component with support for disabled and peer-disabled states.
 *
 * Merges predefined utility classes with any additional {@link className} and passes all other props to the underlying Radix UI label primitive.
 *
 * @returns A React element representing the label.
 */
function Label({ className, ...props }: ComponentProps<typeof Root>) {
    return (
        <Root
            className={cn(
                'flex select-none items-center gap-2 font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
                className,
            )}
            data-slot="label"
            {...props}
        />
    );
}

export { Label };
