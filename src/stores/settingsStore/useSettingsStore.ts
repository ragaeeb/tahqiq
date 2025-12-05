import { create } from 'zustand';

import type { SettingsState } from './types';

const STORAGE_KEYS = {
    geminiApiKeys: 'geminiApiKeys',
    quickSubs: 'quickSubs',
    shamelaApiKey: 'shamelaApiKey',
    shamelaBookEndpoint: 'shamelaBookEndpoint',
} as const;

/**
 * Creates a Zustand store for managing settings state
 * Provides actions for manipulating settings data.
 *
 * Note: Store initializes with empty defaults to avoid SSR hydration mismatch.
 * Call hydrate() in a useEffect on the client to load from localStorage.
 *
 * @returns A Zustand store with settings state and actions
 */
export const useSettingsStore = create<SettingsState>((set) => ({
    // Initialize with empty defaults to avoid SSR hydration mismatch
    geminiApiKeys: [],

    hydrate: () =>
        set(() => {
            const encryptedGeminiApiKeys = localStorage.getItem(STORAGE_KEYS.geminiApiKeys);
            const quickSubs = localStorage.getItem(STORAGE_KEYS.quickSubs);
            const encryptedShamelaApiKey = localStorage.getItem(STORAGE_KEYS.shamelaApiKey);
            const shamelaBookEndpoint = localStorage.getItem(STORAGE_KEYS.shamelaBookEndpoint);

            return {
                geminiApiKeys: encryptedGeminiApiKeys ? atob(encryptedGeminiApiKeys).split('\n') : [],
                quickSubs: quickSubs ? quickSubs.split('\n') : [],
                shamelaApiKey: encryptedShamelaApiKey ? atob(encryptedShamelaApiKey) : '',
                shamelaBookEndpoint: shamelaBookEndpoint || '',
            };
        }),
    quickSubs: [],
    shamelaApiKey: '',
    shamelaBookEndpoint: '',

    updateGeminiApiKeys: (keys) =>
        set(() => {
            localStorage.setItem(STORAGE_KEYS.geminiApiKeys, btoa(keys.join('\n')));
            return { geminiApiKeys: keys };
        }),

    updateQuickSubs: (values) =>
        set(() => {
            localStorage.setItem(STORAGE_KEYS.quickSubs, values.join('\n'));
            return { quickSubs: values };
        }),

    updateShamelaApiKey: (key) =>
        set(() => {
            localStorage.setItem(STORAGE_KEYS.shamelaApiKey, btoa(key));
            return { shamelaApiKey: key };
        }),

    updateShamelaBookEndpoint: (endpoint) =>
        set(() => {
            localStorage.setItem(STORAGE_KEYS.shamelaBookEndpoint, endpoint);
            return { shamelaBookEndpoint: endpoint };
        }),
}));
