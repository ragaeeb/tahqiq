import { record } from 'nanolytics';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import type { StorageKey } from '@/lib/constants';
import { downloadFile } from '@/lib/domUtils';
import { clearStorage, saveToOPFS } from '@/lib/io';

/**
 * Options for the useStorageActions hook.
 */
export interface StorageActionsOptions<T> {
    /** OPFS storage key */
    storageKey: StorageKey;
    /** Function to get the current export data from store state */
    getExportData: () => T;
    /** Function to reset the store */
    reset: () => void;
    /** Analytics event names */
    analytics: { save: string; download: string; reset: string };

    /** Default file name to show on the prompt */
    defaultOutputName?: string;
}

/**
 * Hook that provides save, download, and reset handlers for session persistence.
 * Replaces the common pattern of save/download/reset in page toolbars.
 *
 * @param options - Configuration options
 * @returns Object with handleSave, handleDownload, and handleReset functions
 */
export function useStorageActions<T>({
    storageKey,
    getExportData,
    reset,
    analytics,
    defaultOutputName,
}: StorageActionsOptions<T>) {
    const handleSave = useCallback(async () => {
        record(analytics.save);
        const data = getExportData();

        try {
            await saveToOPFS(storageKey, data);
            toast.success('Saved state');
        } catch (err) {
            console.error(`Could not save ${storageKey}`, err);
            downloadFile(`${storageKey}-${Date.now()}.json`, JSON.stringify(data, null, 2));
        }
    }, [analytics.save, getExportData, storageKey]);

    const handleDownload = useCallback(() => {
        const name = prompt('Enter output file name', defaultOutputName);

        if (name) {
            record(analytics.download, name);
            const data = getExportData();
            downloadFile(name.endsWith('.json') ? name : `${name}.json`, JSON.stringify(data, null, 2));
        }
    }, [analytics.download, getExportData, defaultOutputName]);

    const router = useRouter();
    const pathname = usePathname();

    const handleReset = useCallback(() => {
        record(analytics.reset);

        // Immediate URL update to prevent race conditions
        if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', pathname);
        }

        router.replace(pathname, { scroll: false });

        // Give the router a tick to update searchParams before remounting DatasetLoader via reset()
        setTimeout(() => {
            reset();
        }, 100);
    }, [analytics.reset, pathname, reset, router]);

    const handleResetAll = useCallback(async () => {
        record(analytics.reset);

        // Immediate URL update
        if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', pathname);
        }

        router.replace(pathname, { scroll: false });

        try {
            await clearStorage(storageKey);
        } catch (err) {
            console.error(`Failed to clear storage for ${storageKey}`, err);
        }

        // Give the router a tick to update searchParams before remounting DatasetLoader via reset()
        setTimeout(() => {
            reset();
        }, 100);
    }, [analytics.reset, pathname, reset, router, storageKey]);

    // Return memoized object to ensure stable references
    return useMemo(
        () => ({ handleDownload, handleReset, handleResetAll, handleSave }),
        [handleSave, handleDownload, handleReset, handleResetAll],
    );
}
