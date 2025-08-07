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
    ...props
}: ConfirmButtonProps) {
    const { handleClick, isConfirming } = useConfirmation(onClick, resetTimeoutMs);

    return (
        <Button
            aria-label={isConfirming ? `Confirm: ${confirmText}` : undefined}
            aria-pressed={isConfirming}
            onClick={handleClick as any}
            variant="destructive"
            {...props}
        >
            {isConfirming ? (
                <>
                    <CheckIcon />
                    {confirmText}
                </>
            ) : (
                <>{children}</>
            )}
        </Button>
    );
}
