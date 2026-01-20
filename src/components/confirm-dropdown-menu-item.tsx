'use client';

import { CheckIcon } from 'lucide-react';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

import { useConfirmation } from './hooks/useConfirmation';

interface ConfirmDropdownMenuItemProps extends Omit<React.ComponentProps<typeof DropdownMenuItem>, 'onClick'> {
    children: React.ReactNode;
    confirmText?: string;
    onClick: () => void;
}

export function ConfirmDropdownMenuItem({
    children,
    confirmText = 'Confirm',
    onClick,
    ...props
}: ConfirmDropdownMenuItemProps) {
    const { handleClick, isConfirming } = useConfirmation(onClick);

    return (
        <DropdownMenuItem
            aria-label={isConfirming ? `Confirm: ${confirmText}` : undefined}
            aria-pressed={isConfirming}
            onSelect={handleClick as any}
            variant="destructive"
            {...props}
        >
            {isConfirming ? (
                <>
                    <CheckIcon />
                    {confirmText}
                </>
            ) : (
                children
            )}
        </DropdownMenuItem>
    );
}
