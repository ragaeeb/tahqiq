import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A React hook that provides confirmation state management for destructive actions.
 *
 * Implements a two-step confirmation pattern where the first click sets a confirming state,
 * and the second click executes the action. Optionally supports auto-reset after a timeout.
 *
 * @param onClick - The callback function to execute when the action is confirmed (second click)
 * @param resetTimeoutMs - Optional timeout in milliseconds to automatically reset the confirmation state.
 *                        If not provided or <= 0, no auto-reset will occur.
 *
 * @returns An object containing:
 * - `handleClick`: Click handler to be attached to the trigger element
 * - `isConfirming`: Boolean indicating whether the component is in confirmation state
 * - `reset`: Function to manually reset the confirmation state
 *
 * @example
 * ```tsx
 * const DeleteButton = () => {
 *   const { handleClick, isConfirming } = useConfirmation(
 *     () => console.log('Item deleted!'),
 *     3000 // Auto-reset after 3 seconds
 *   );
 *
 *   return (
 *     <button onClick={handleClick}>
 *       {isConfirming ? 'Click again to confirm' : 'Delete Item'}
 *     </button>
 *   );
 * };
 * ```
 */
export const useConfirmation = (onClick: () => void, resetTimeoutMs?: number) => {
    const [isConfirming, setIsConfirming] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const clearTimeoutRef = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        setIsConfirming(false);
        clearTimeoutRef();
    }, [clearTimeoutRef]);

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!isConfirming) {
                e.preventDefault();
                setIsConfirming(true);

                // Set timeout to reset confirmation state if resetTimeoutMs is provided and > 0
                if (resetTimeoutMs && resetTimeoutMs > 0) {
                    clearTimeoutRef(); // Clear any existing timeout
                    timeoutRef.current = setTimeout(() => {
                        setIsConfirming(false);
                        timeoutRef.current = null;
                    }, resetTimeoutMs);
                }
            } else {
                onClick();
                reset();
            }
        },
        [onClick, isConfirming, resetTimeoutMs, clearTimeoutRef, reset],
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            clearTimeoutRef();
        };
    }, [clearTimeoutRef]);

    return { handleClick, isConfirming, reset };
};
