import memoizeOne from 'memoize-one';
import type { Excerpt, ExcerptsState, Heading } from './types';

/**
 * Selects all excerpts from the store (respecting filters)
 */
export const selectAllExcerpts = memoizeOne(
    (state: ExcerptsState): Excerpt[] => {
        console.log('[selectAllExcerpts] Called');
        console.log('[selectAllExcerpts] state.excerpts.length:', state.excerpts.length);
        console.log('[selectAllExcerpts] state.filteredExcerptIds:', state.filteredExcerptIds?.length ?? 'null');

        if (state.filteredExcerptIds) {
            const idSet = new Set(state.filteredExcerptIds);
            const result = state.excerpts.filter((e) => idSet.has(e.id));
            console.log('[selectAllExcerpts] Filtered result.length:', result.length);
            return result;
        }
        return state.excerpts;
    },
    // Custom equality: only recompute if excerpts array or filter IDs changed
    ([prevState], [nextState]) => {
        const excerptsSame = prevState.excerpts === nextState.excerpts;
        const filtersSame = prevState.filteredExcerptIds === nextState.filteredExcerptIds;
        console.log('[selectAllExcerpts] equality check: excerptsSame=', excerptsSame, 'filtersSame=', filtersSame);
        console.log(
            '[selectAllExcerpts] prev.excerpts.length=',
            prevState.excerpts.length,
            'next.excerpts.length=',
            nextState.excerpts.length,
        );
        return excerptsSame && filtersSame;
    },
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
    (state: ExcerptsState): Excerpt[] => {
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
