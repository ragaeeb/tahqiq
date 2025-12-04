import type { Entry, ExcerptsState, Footnote, Heading } from './types';

/**
 * Selects all excerpts from the store
 */
export const selectAllExcerpts = (state: ExcerptsState): Entry[] => state.excerpts;

/**
 * Selects all headings from the store
 */
export const selectAllHeadings = (state: ExcerptsState): Heading[] => state.headings;

/**
 * Selects all footnotes from the store
 */
export const selectAllFootnotes = (state: ExcerptsState): Footnote[] => state.footnotes;

/**
 * Gets the total number of excerpts
 */
export const selectExcerptCount = (state: ExcerptsState): number => state.excerpts.length;

/**
 * Gets the total number of headings
 */
export const selectHeadingCount = (state: ExcerptsState): number => state.headings.length;

/**
 * Gets the total number of footnotes
 */
export const selectFootnoteCount = (state: ExcerptsState): number => state.footnotes.length;
