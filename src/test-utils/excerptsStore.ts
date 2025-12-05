import { act } from '@testing-library/react';

import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';

/**
 * Resets the excerptsStore to its initial state
 */
export const resetExcerptsStoreState = () => {
    act(() => {
        useExcerptsStore.getState().reset();
    });
};

/**
 * Creates mock excerpt data for testing
 */
export const createMockExcerpts = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
        from: i + 1,
        id: `E${i + 1}`,
        nass: `نص عربي ${i + 1}`,
        text: `Translation ${i + 1}`,
    }));

/**
 * Creates mock heading data for testing
 */
export const createMockHeadings = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
        from: i + 1,
        id: `H${i + 1}`,
        nass: `عنوان ${i + 1}`,
        text: `Heading ${i + 1}`,
    }));

/**
 * Creates mock footnote data for testing
 */
export const createMockFootnotes = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
        from: i + 1,
        id: `F${i + 1}`,
        nass: `حاشية ${i + 1}`,
        text: `Footnote ${i + 1}`,
    }));
