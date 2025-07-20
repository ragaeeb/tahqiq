import { useCallback, useEffect, useState } from 'react';

export const useConfirmation = (onClick: () => void) => {
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        return () => {
            setIsConfirming(false);
        };
    }, []);

    const handleClick = useCallback(
        (e: Event) => {
            if (!isConfirming) {
                e.preventDefault();
                setIsConfirming(true);
            } else {
                onClick();
            }
        },
        [onClick, isConfirming],
    );

    return { handleClick, isConfirming };
};
