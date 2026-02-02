import { CheckIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

interface ResetButtonProps {
    /** Reset state only (keeps OPFS data for session restore) */
    onReset: () => void;
    /** Reset state AND clear OPFS storage */
    onResetAll: () => void;
}

/**
 * A reset button that shows two options in confirmation state:
 * - Reset: clears current state only (OPFS data is preserved)
 * - Clear All: clears state AND removes persisted OPFS data
 */
export function ResetButton({ onReset, onResetAll }: ResetButtonProps) {
    const [isConfirming, setIsConfirming] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startConfirmation = useCallback(() => {
        setIsConfirming(true);
        // Auto-reset after 4 seconds if no action taken
        timeoutRef.current = setTimeout(() => {
            setIsConfirming(false);
        }, 4000);
    }, []);

    const handleReset = useCallback(() => {
        setIsConfirming(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        onReset();
    }, [onReset]);

    const handleResetAll = useCallback(() => {
        setIsConfirming(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        onResetAll();
    }, [onResetAll]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    if (isConfirming) {
        return (
            <div className="inline-flex gap-1">
                <Button
                    className="animate-pulse"
                    onClick={handleReset}
                    size="sm"
                    title="Reset state (keep saved data)"
                    variant="secondary"
                >
                    <CheckIcon className="h-4 w-4" />
                    Reset
                </Button>
                <Button
                    className="animate-pulse"
                    onClick={handleResetAll}
                    size="sm"
                    title="Clear all including saved data"
                    variant="destructive"
                >
                    <Trash2Icon className="h-4 w-4" />
                    Clear All
                </Button>
            </div>
        );
    }

    return (
        <Button onClick={startConfirmation} title="Reset" variant="ghost">
            <RefreshCwIcon className="h-4 w-4" />
        </Button>
    );
}
