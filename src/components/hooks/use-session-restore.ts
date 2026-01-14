import { record } from 'nanolytics';
import { useEffect, useRef, useState } from 'react';

import type { StorageKey } from '@/lib/constants';
import { loadFromOPFS } from '@/lib/io';

/**
 * Hook to restore session data from OPFS on mount.
 * Replaces the common pattern of loading from OPFS in useEffect.
 *
 * @param storageKey - The OPFS storage key to load from
 * @param init - Function to initialize the store with loaded data
 * @param analyticsEvent - Analytics event name to record on successful restore
 * @param adapter - Optional function to transform data before passing to init
 */
export function useSessionRestore<T>(
    storageKey: StorageKey,
    init: (data: T) => void,
    analyticsEvent: string,
    adapter?: (data: unknown) => T,
): { isLoading: boolean } {
    const [isLoading, setIsLoading] = useState(true);
    const initRef = useRef(init);
    const adapterRef = useRef(adapter);

    // Keep refs updated
    initRef.current = init;
    adapterRef.current = adapter;

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);

        loadFromOPFS(storageKey)
            .then((data) => {
                if (cancelled) {
                    return;
                }
                if (data) {
                    record(analyticsEvent);
                    initRef.current(adapterRef.current ? adapterRef.current(data) : (data as T));
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [storageKey, analyticsEvent]);

    return { isLoading };
}
