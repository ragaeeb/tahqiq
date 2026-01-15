import { CheckIcon } from 'lucide-react';

import { useConfirmation } from '@/components/hooks/useConfirmation';
import { Button } from '@/components/ui/button';

interface ConfirmButtonProps extends Omit<React.ComponentProps<typeof Button>, 'onClick'> {
    children: React.ReactNode;
    confirmText?: string;
    onClick: () => void;
    resetTimeoutMs?: number;
}

export function ConfirmButton({
    children,
    confirmText = 'Confirm',
    onClick,
    resetTimeoutMs = 3000,
    size,
    ...props
}: ConfirmButtonProps) {
    const { handleClick, isConfirming } = useConfirmation(onClick, resetTimeoutMs);
    const isIconOnly = size === 'icon';

    return (
        <Button
            aria-label={isConfirming ? `Confirm: ${confirmText}` : undefined}
            aria-pressed={isConfirming}
            onClick={handleClick as any}
            variant={isConfirming ? 'destructive' : props.variant}
            size={size}
            {...props}
            className={`${props.className ?? ''} ${isConfirming && isIconOnly ? 'animate-pulse ring-2 ring-red-500' : ''}`}
        >
            {isConfirming ? (
                isIconOnly ? (
                    <CheckIcon className="h-4 w-4" />
                ) : (
                    <>
                        <CheckIcon />
                        {confirmText}
                    </>
                )
            ) : (
                <>{children}</>
            )}
        </Button>
    );
}
