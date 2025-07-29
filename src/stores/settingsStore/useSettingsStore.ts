import { create } from 'zustand';

import type { SettingsState } from './types';

/**
 * Creates a Zustand store for managing settings state
 * Provides actions for manipulating settings data.
 * Initializes with default formatting options from constants
 *
 * @returns A Zustand store with settings state and actions
 */
export const useSettingsStore = create<SettingsState>((set) => {
    const encryptedGeminiApiKeys = typeof window !== 'undefined' && localStorage.getItem('geminiApiKeys');
    const quickSubs = typeof window !== 'undefined' && localStorage.getItem('quickSubs');

    return {
        geminiApiKeys: encryptedGeminiApiKeys ? atob(encryptedGeminiApiKeys).split('\n') : [],
        quickSubs: quickSubs ? quickSubs.split('\n') : [],
        updateGeminiApiKeys: (keys) => {
            return set(() => {
                localStorage.setItem('geminiApiKeys', btoa(keys.join('\n')));
                return { geminiApiKeys: keys };
            });
        },
        updateQuickSubs: (values) => {
            return set(() => {
                localStorage.setItem('quickSubs', values.join('\n'));
                return { quickSubs: values };
            });
        },
    };
});
