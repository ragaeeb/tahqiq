import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PatchStore } from './types';

/**
 * Zustand store for managing page patches.
 * Tracks minimal text changes for later reapplication.
 */
export const usePatchStore = create<PatchStore>()(
    immer((set, get) => ({
        addPatch: (patch) =>
            set((state) => {
                state.patches.push({ ...patch, createdAt: Date.now() });
            }),
        bookId: undefined,

        clearPatches: () =>
            set((state) => {
                state.patches = [];
            }),

        exportPatches: () => {
            const { patches, bookId } = get();
            return { bookId, patches: [...patches] };
        },

        importPatches: (data) =>
            set((state) => {
                state.bookId = data.bookId;
                state.patches = data.patches;
            }),
        patches: [],

        setBookId: (bookId) =>
            set((state) => {
                state.bookId = bookId;
            }),
    })),
);
