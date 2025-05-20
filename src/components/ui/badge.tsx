import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
    {
        defaultVariants: {
            variant: 'default',
        },
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
                destructive:
                    'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
                outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
                secondary: 'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
            },
        },
    },
);

/**
 * Renders a styled badge element with customizable appearance variants.
 *
 * Supports rendering as a native <span> or as a child component using Radix UI's Slot. The badge's style can be adjusted via the {@link variant} prop, and additional class names can be merged with the default styles.
 *
 * @param asChild - If true, renders the badge as a child component using Slot instead of a <span>.
 * @param variant - Selects the visual style of the badge. Options are "default", "destructive", "outline", and "secondary".
 */
function Badge({
    asChild = false,
    className,
    variant,
    ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : 'span';

    return <Comp className={cn(badgeVariants({ variant }), className)} data-slot="badge" {...props} />;
}

export { Badge, badgeVariants };
