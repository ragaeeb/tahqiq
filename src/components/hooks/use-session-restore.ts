import { record } from 'nanolytics';
import { useEffect } from 'react';

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
): void {
    useEffect(() => {
        loadFromOPFS(storageKey).then((data) => {
            if (data) {
                record(analyticsEvent);
                init(adapter ? adapter(data) : (data as T));
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- storageKey and analyticsEvent are stable strings
    }, [init]);
}
