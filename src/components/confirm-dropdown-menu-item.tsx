'use client';

import { CheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface ConfirmDropdownMenuItemProps extends Omit<React.ComponentProps<typeof DropdownMenuItem>, 'onClick'> {
    children: React.ReactNode;
    confirmText?: string;
    onClick: () => void;
}

export function ConfirmDropdownMenuItem({
    children,
    confirmText = 'Click to confirm',
    onClick,
    ...props
}: ConfirmDropdownMenuItemProps) {
    const [isConfirming, setIsConfirming] = useState(false);

    const handleClick = (e: Event) => {
        if (!isConfirming) {
            e.preventDefault();
            setIsConfirming(true);
        } else {
            onClick();
        }
    };

    useEffect(() => {
        return () => {
            setIsConfirming(false);
        };
    }, []);

    return (
        <DropdownMenuItem onSelect={handleClick} variant="destructive" {...props}>
            {isConfirming ? (
                <>
                    <CheckIcon />
                    {confirmText}
                </>
            ) : (
                <>{children}</>
            )}
        </DropdownMenuItem>
    );
}
