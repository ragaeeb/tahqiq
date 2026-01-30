import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { LatestContractVersion } from '@/lib/constants';
import { nowInSeconds } from '@/lib/time';
import type { WebState, WebStateCore } from './types';

const INITIAL_STATE: WebStateCore = {
    contractVersion: LatestContractVersion.Web,
    createdAt: nowInSeconds(),
    filteredPageIds: [],
    filteredTitleIds: [],
    lastUpdatedAt: nowInSeconds(),
    pages: [],
    postProcessingApps: [],
    type: 'web',
    urlPattern: '',
};

/**
 * Creates a Zustand store for managing Web book state.
 * Uses Immer for immutable updates.
 */
export const useWebStore = create<WebState>()(
    immer((set) => ({
        ...INITIAL_STATE,

        filterPagesByIds: (ids) =>
            set((state) => {
                state.filteredPageIds = ids;
            }),

        filterTitlesByIds: (ids) =>
            set((state) => {
                state.filteredTitleIds = ids;
            }),

        init: (data) =>
            set((state) => {
                Object.assign(state, { ...INITIAL_STATE, ...data });
            }),

        removeFootnotes: () =>
            set((state) => {
                for (const page of state.pages) {
                    if (page.metadata?.footnotes) {
                        page.metadata.footnote = undefined;
                    }
                }
            }),

        reset: () =>
            set((state) => {
                Object.assign(state, INITIAL_STATE);
            }),
    })),
);
