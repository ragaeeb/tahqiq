import type { Book, BookStateCore, Page } from './types';

import { selectCurrentPages } from './selectors';

/**
 * Selects all pages in the current manuscript or clears selection
 *
 * @param state - Current manuscript state
 * @param isSelected - Boolean indicating whether to select all or clear selection
 * @returns Object with updated selection state
 */
export const selectAllPages = (state: BookStateCore, isSelected: boolean) => {
    return { selectedPages: isSelected ? selectCurrentPages(state) : [] };
};

export const initStore = (fileToBook: Record<string, Book>) => {
    const volumeToPages: Record<number, Page[]> = {};

    Object.entries(fileToBook).forEach(([file, book]) => {
        const volume = Number(file.split('.')[0]);

        book.pages.forEach((p) => {
            if (!volumeToPages[volume]) {
                volumeToPages[volume] = [];
            }

            volumeToPages[volume].push(p);
        });
    });

    return { selectedVolume: 1, volumeToPages };
};
