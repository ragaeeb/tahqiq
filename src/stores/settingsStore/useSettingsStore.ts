import { create } from 'zustand';

import type { SettingsState } from './types';

const STORAGE_KEYS = {
    aslDataset: 'aslDataset',
    excerptsDataset: 'huggingfaceExcerptDataset',
    huggingfaceToken: 'huggingfaceToken',
    quickSubs: 'quickSubs',
    shamelaDataset: 'shamelaBookEndpoint',
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
    aslDataset: '',
    // Initialize with empty defaults to avoid SSR hydration mismatch
    excerptsDataset: '',
    huggingfaceToken: '',

    hydrate: () =>
        set(() => {
            const quickSubs = localStorage.getItem(STORAGE_KEYS.quickSubs);
            const shamelaDataset = localStorage.getItem(STORAGE_KEYS.shamelaDataset);
            const encryptedHuggingfaceToken = localStorage.getItem(STORAGE_KEYS.huggingfaceToken);
            const huggingfaceExcerptDataset = localStorage.getItem(STORAGE_KEYS.excerptsDataset);

            return {
                aslDataset: localStorage.getItem(STORAGE_KEYS.aslDataset) || '',
                excerptsDataset: huggingfaceExcerptDataset || '',
                huggingfaceToken: encryptedHuggingfaceToken ? atob(encryptedHuggingfaceToken) : '',
                quickSubs: quickSubs ? quickSubs.split('\n') : [],
                shamelaDataset: shamelaDataset || '',
            };
        }),
    quickSubs: [],
    shamelaDataset: '',

    updateAslDataset: (endpoint) =>
        set(() => {
            localStorage.setItem(STORAGE_KEYS.aslDataset, endpoint);
            return { aslDataset: endpoint };
        }),

    updateExcerptsDataset: (huggingfaceExcerptDataset) =>
        set(() => {
            localStorage.setItem(STORAGE_KEYS.excerptsDataset, huggingfaceExcerptDataset);
            return { excerptsDataset: huggingfaceExcerptDataset };
        }),

    updateHuggingfaceToken: (token) =>
        set(() => {
            localStorage.setItem(STORAGE_KEYS.huggingfaceToken, btoa(token));
            return { huggingfaceToken: token };
        }),

    updateQuickSubs: (values) =>
        set(() => {
            localStorage.setItem(STORAGE_KEYS.quickSubs, values.join('\n'));
            return { quickSubs: values };
        }),

    updateShamelaDataset: (endpoint) =>
        set(() => {
            localStorage.setItem(STORAGE_KEYS.shamelaDataset, endpoint);
            return { shamelaDataset: endpoint };
        }),
}));
