'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger as RadixDialogTrigger } from '@/components/ui/dialog';

interface DialogTriggerButtonProps extends Omit<React.ComponentProps<typeof Button>, 'onClick'> {
    /**
     * Optional default open state for uncontrolled usage
     */
    defaultOpen?: boolean;

    /**
     * Optional callback called when dialog open state changes
     */
    onOpenChange?: (open: boolean) => void;

    /**
     * Optional controlled open state
     */
    open?: boolean;

    /**
     * Function that returns the dialog content. Only called when dialog is opened.
     * This ensures lazy loading of the dialog content.
     */
    renderContent: () => React.ReactNode;
}

interface DialogTriggerProps {
    /**
     * Optional default open state for uncontrolled usage
     */
    defaultOpen?: boolean;

    /**
     * Optional callback called when dialog open state changes
     */
    onOpenChange?: (open: boolean) => void;

    /**
     * Optional controlled open state
     */
    open?: boolean;

    /**
     * Function that returns the dialog content. Only called when dialog is opened.
     * This ensures lazy loading of the dialog content.
     */
    renderContent: () => React.ReactNode;

    /**
     * The trigger element that will open the dialog when clicked
     */
    trigger: React.ReactNode;
}

/**
 * A flexible dialog component that accepts any trigger element.
 * Content is lazily loaded only when the dialog opens.
 */
export function DialogTrigger({ defaultOpen, onOpenChange, open, renderContent, trigger }: DialogTriggerProps) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen ?? false);

    // Use controlled or uncontrolled state
    const dialogOpen = open ?? isOpen;
    const setDialogOpen = React.useCallback(
        (newOpen: boolean) => {
            if (open === undefined) {
                setIsOpen(newOpen);
            }
            onOpenChange?.(newOpen);
        },
        [open, onOpenChange],
    );

    return (
        <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
            <RadixDialogTrigger asChild>{trigger}</RadixDialogTrigger>
            {/* Only render content when dialog is open - lazy loading! */}
            {dialogOpen && <DialogContent>{renderContent()}</DialogContent>}
        </Dialog>
    );
}

/**
 * A dialog with a button trigger. All button props can be passed through.
 * Content is lazily loaded only when the dialog opens.
 *
 * Benefits:
 * - Better developer experience - just pass renderContent
 * - Lazy loading - content only mounts when dialog opens
 * - Flexible - all Button props are supported
 */
export function DialogTriggerButton({
    defaultOpen,
    onOpenChange,
    open,
    renderContent,
    ...buttonProps
}: DialogTriggerButtonProps) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen ?? false);

    // Use controlled or uncontrolled state
    const dialogOpen = open ?? isOpen;
    const setDialogOpen = React.useCallback(
        (newOpen: boolean) => {
            if (open === undefined) {
                setIsOpen(newOpen);
            }
            onOpenChange?.(newOpen);
        },
        [open, onOpenChange],
    );

    return (
        <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
            <RadixDialogTrigger asChild>
                <Button {...buttonProps} />
            </RadixDialogTrigger>
            {/* Only render content when dialog is open - lazy loading! */}
            {dialogOpen && renderContent()}
        </Dialog>
    );
}
