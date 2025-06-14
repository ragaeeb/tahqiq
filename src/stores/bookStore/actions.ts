import type { BookStateCore } from './types';

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
