'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Provides the root container for a dialog, managing its open and close state.
 *
 * Wraps the Radix UI Dialog root component and adds a `data-slot="dialog"` attribute for identification.
 */
function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

/**
 * Renders a button that closes the dialog when activated.
 *
 * Forwards all props to the underlying Radix UI close primitive and adds a `data-slot="dialog-close"` attribute.
 */
function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/**
 * Renders the main content area of a dialog inside a portal with an overlay, styling, and a close button.
 *
 * Includes a close button with an accessible label and supports custom content and additional class names.
 *
 * @param className - Additional class names to apply to the dialog content container.
 * @returns The dialog content element with overlay and close functionality.
 */
function DialogContent({ children, className, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
    return (
        <DialogPortal data-slot="dialog-portal">
            <DialogOverlay />
            <DialogPrimitive.Content
                className={cn(
                    'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
                    className,
                )}
                data-slot="dialog-content"
                {...props}
            >
                {children}
                <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
                    <XIcon />
                    <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

/**
 * Renders a styled description for dialog content, typically used to provide additional context or instructions.
 *
 * Applies muted text styling and forwards all props to the underlying Radix UI dialog description component.
 */
function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description
            className={cn('text-muted-foreground text-sm', className)}
            data-slot="dialog-description"
            {...props}
        />
    );
}

/**
 * Arranges dialog footer content in a responsive flex layout.
 *
 * Stacks children vertically on small screens and aligns them horizontally to the end on larger screens. Accepts additional class names and props for customization.
 */
function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
            data-slot="dialog-footer"
            {...props}
        />
    );
}

/**
 * Renders a styled header section for dialog content.
 *
 * Arranges its children in a vertical flex layout with responsive text alignment, suitable for use at the top of a dialog.
 */
function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
            data-slot="dialog-header"
            {...props}
        />
    );
}

/**
 * Renders a modal overlay with fade animations and a semi-transparent background for the dialog.
 *
 * @param className - Additional class names to merge with the default overlay styles.
 */
function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            className={cn(
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
                className,
            )}
            data-slot="dialog-overlay"
            {...props}
        />
    );
}

/**
 * Renders the dialog content in a React portal for proper layering and accessibility.
 *
 * Forwards all props to the underlying Radix UI Portal component and adds a data attribute for slot identification.
 */
function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

/**
 * Renders the dialog title with default styling and forwards additional props.
 *
 * Applies font size and weight styles, merges any additional class names, and sets a data attribute for identification.
 */
function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            className={cn('text-lg leading-none font-semibold', className)}
            data-slot="dialog-title"
            {...props}
        />
    );
}

/**
 * Renders a trigger element that opens the dialog when activated.
 *
 * Forwards all props to the underlying Radix UI trigger component.
 */
function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
