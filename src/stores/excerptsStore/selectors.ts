import memoizeOne from 'memoize-one';
import type { Excerpt, ExcerptsState, Footnote, Heading } from './types';

/**
 * Selects all excerpts from the store (respecting filters)
 */
export const selectAllExcerpts = memoizeOne(
    (state: ExcerptsState): Excerpt[] => {
        if (state.filteredExcerptIds) {
            const idSet = new Set(state.filteredExcerptIds);
            return state.excerpts.filter((e) => idSet.has(e.id));
        }
        return state.excerpts;
    },
    // Custom equality: only recompute if excerpts array or filter IDs changed
    ([prevState], [nextState]) =>
        prevState.excerpts === nextState.excerpts && prevState.filteredExcerptIds === nextState.filteredExcerptIds,
);

/**
 * Selects all headings from the store (respecting filters)
 */
export const selectAllHeadings = memoizeOne(
    (state: ExcerptsState): Heading[] => {
        if (state.filteredHeadingIds) {
            const idSet = new Set(state.filteredHeadingIds);
            return state.headings.filter((h) => idSet.has(h.id));
        }
        return state.headings;
    },
    // Custom equality: only recompute if headings array or filter IDs changed
    ([prevState], [nextState]) =>
        prevState.headings === nextState.headings && prevState.filteredHeadingIds === nextState.filteredHeadingIds,
);

/**
 * Selects all footnotes from the store (respecting filters)
 */
export const selectAllFootnotes = memoizeOne(
    (state: ExcerptsState): Footnote[] => {
        if (state.filteredFootnoteIds) {
            const idSet = new Set(state.filteredFootnoteIds);
            return state.footnotes.filter((f) => idSet.has(f.id));
        }
        return state.footnotes;
    },
    // Custom equality: only recompute if footnotes array or filter IDs changed
    ([prevState], [nextState]) =>
        prevState.footnotes === nextState.footnotes && prevState.filteredFootnoteIds === nextState.filteredFootnoteIds,
);

/**
 * Gets the total number of excerpts (unfiltered)
 */
export const selectExcerptCount = (state: ExcerptsState): number => state.excerpts.length;

/**
 * Gets the total number of headings (unfiltered)
 */
export const selectHeadingCount = (state: ExcerptsState): number => state.headings.length;

/**
 * Gets the total number of footnotes (unfiltered)
 */
export const selectFootnoteCount = (state: ExcerptsState): number => state.footnotes.length;
