import { LatestContractVersion, TRANSLATE_EXCERPTS_PROMPT } from '@/lib/constants';
import { adaptExcerptsToLatest } from '@/lib/migration';
import { applyBulkFieldFormatting, buildIdIndexMap, deleteItemsByIds } from '@/lib/store-utils';
import { nowInSeconds } from '@/lib/time';
import type { Excerpt, Excerpts, ExcerptsStateCore, Heading } from './types';

/**
 * Initial state for the excerpts store.
 * Used by both initStore and reset to ensure consistency.
 */
export const INITIAL_STATE: ExcerptsStateCore = {
    collection: undefined,
    contractVersion: LatestContractVersion.Excerpts,
    createdAt: new Date(),
    excerpts: [],
    filteredExcerptIds: undefined,
    filteredFootnoteIds: undefined,
    filteredHeadingIds: undefined,
    footnotes: [],
    headings: [],
    inputFileName: undefined,
    lastUpdatedAt: new Date(),
    options: {},
    postProcessingApps: [],
    promptForTranslation: TRANSLATE_EXCERPTS_PROMPT.join('\n'),
};

/**
 * Initializes the store from Excerpts data, migrating if necessary
 */
export const initStore = (data: Excerpts, fileName?: string): ExcerptsStateCore => {
    const migrated = adaptExcerptsToLatest(data);

    return {
        ...INITIAL_STATE,
        collection: migrated.collection,
        contractVersion: migrated.contractVersion,
        createdAt: new Date(migrated.createdAt * 1000),
        excerpts: [...migrated.excerpts],
        footnotes: [...migrated.footnotes],
        headings: [...migrated.headings],
        inputFileName: fileName,
        lastUpdatedAt: new Date(migrated.lastUpdatedAt * 1000),
        options: migrated.options,
        promptForTranslation: migrated.promptForTranslation || TRANSLATE_EXCERPTS_PROMPT.join('\n'),
    };
};

/**
 * Resets the store to initial state
 */
export const resetStore = (): ExcerptsStateCore => ({ ...INITIAL_STATE, createdAt: new Date() });

/**
 * Updates a single excerpt
 */
export const updateExcerpt = (state: ExcerptsStateCore, id: string, updates: Partial<Omit<Excerpt, 'id'>>): void => {
    const index = state.excerpts.findIndex((e) => e.id === id);
    if (index !== -1) {
        state.excerpts[index] = { ...state.excerpts[index], ...updates, lastUpdatedAt: nowInSeconds() };
        state.lastUpdatedAt = new Date();
    }
};

/**
 * Creates a new excerpt from an existing one with selected Arabic text
 * Copies all properties except sets new ID, new nass text, and clears translation
 */
export const createExcerptFromExisting = (state: ExcerptsStateCore, sourceId: string, newNassText: string): void => {
    const sourceIndex = state.excerpts.findIndex((e) => e.id === sourceId);

    if (sourceIndex === -1) {
        return;
    }

    const sourceExcerpt = state.excerpts[sourceIndex];

    const lastUpdatedAt = nowInSeconds();

    // Remove the extracted text from the source excerpt
    const updatedSourceNass = (sourceExcerpt.nass || '').replace(newNassText, '').trim();
    state.excerpts[sourceIndex] = { ...sourceExcerpt, lastUpdatedAt, nass: updatedSourceNass };

    const newExcerpt: Excerpt = {
        ...sourceExcerpt,
        id: `${sourceExcerpt.id}${lastUpdatedAt}`,
        lastUpdatedAt,
        nass: newNassText,
        text: '',
    };

    // Insert after the source excerpt
    state.excerpts.splice(sourceIndex + 1, 0, newExcerpt);

    // If a filter is active, add the new excerpt's ID to the filter so it's visible
    if (state.filteredExcerptIds) {
        const filterIndex = state.filteredExcerptIds.indexOf(sourceId);
        if (filterIndex !== -1) {
            // Insert after the source ID in the filter list too
            state.filteredExcerptIds.splice(filterIndex + 1, 0, newExcerpt.id);
        } else {
            // Source not in filter but we still want to show the new one
            state.filteredExcerptIds.push(newExcerpt.id);
        }
    }

    state.lastUpdatedAt = new Date();
};

/**
 * Updates a single heading
 */
export const updateHeading = (state: ExcerptsStateCore, id: string, updates: Partial<Omit<Heading, 'id'>>): void => {
    const index = state.headings.findIndex((h) => h.id === id);
    if (index !== -1) {
        state.headings[index] = { ...state.headings[index], ...updates, lastUpdatedAt: nowInSeconds() };
        state.lastUpdatedAt = new Date();
    }
};

/**
 * Updates a single footnote
 */
export const updateFootnote = (state: ExcerptsStateCore, id: string, updates: Partial<Omit<Excerpt, 'id'>>): void => {
    const index = state.footnotes.findIndex((f) => f.id === id);
    if (index !== -1) {
        state.footnotes[index] = { ...state.footnotes[index], ...updates, lastUpdatedAt: nowInSeconds() };
        state.lastUpdatedAt = new Date();
    }
};

/**
 * Deletes multiple excerpts by ID
 */
export const deleteExcerpts = (state: ExcerptsStateCore, ids: string[]): void => {
    state.excerpts = deleteItemsByIds(state.excerpts, ids);
    state.lastUpdatedAt = new Date();
};

/**
 * Deletes multiple headings by ID
 */
export const deleteHeadings = (state: ExcerptsStateCore, ids: string[]): void => {
    state.headings = deleteItemsByIds(state.headings, ids);
    state.lastUpdatedAt = new Date();
};

/**
 * Deletes multiple footnotes by ID
 */
export const deleteFootnotes = (state: ExcerptsStateCore, ids: string[]): void => {
    state.footnotes = deleteItemsByIds(state.footnotes, ids);
    state.lastUpdatedAt = new Date();
};

/**
 * Applies a formatting function to all excerpt translations in bulk
 */
export const applyTranslationFormatting = (state: ExcerptsStateCore, formatFn: (text: string) => string): void => {
    state.excerpts = applyBulkFieldFormatting(state.excerpts, 'text', formatFn, 'lastUpdatedAt');
    state.lastUpdatedAt = new Date();
};

/**
 * Applies a formatting function to all heading translations in bulk
 */
export const applyHeadingFormatting = (state: ExcerptsStateCore, formatFn: (text: string) => string): void => {
    state.headings = applyBulkFieldFormatting(state.headings, 'text', formatFn, 'lastUpdatedAt');
    state.lastUpdatedAt = new Date();
};

/**
 * Applies a formatting function to all footnote translations in bulk
 */
export const applyFootnoteFormatting = (state: ExcerptsStateCore, formatFn: (text: string) => string): void => {
    state.footnotes = applyBulkFieldFormatting(state.footnotes, 'text', formatFn, 'lastUpdatedAt');
    state.lastUpdatedAt = new Date();
};

/**
 * Applies a formatting function to all excerpt nass (Arabic) in bulk
 */
export const applyExcerptNassFormatting = (state: ExcerptsStateCore, formatFn: (nass: string) => string): void => {
    state.excerpts = applyBulkFieldFormatting(state.excerpts, 'nass', formatFn, 'lastUpdatedAt');
    state.lastUpdatedAt = new Date();
};

/**
 * Applies a formatting function to all heading nass (Arabic) in bulk
 */
export const applyHeadingNassFormatting = (state: ExcerptsStateCore, formatFn: (nass: string) => string): void => {
    state.headings = applyBulkFieldFormatting(state.headings, 'nass', formatFn, 'lastUpdatedAt');
    state.lastUpdatedAt = new Date();
};

/**
 * Applies a formatting function to all footnote nass (Arabic) in bulk
 */
export const applyFootnoteNassFormatting = (state: ExcerptsStateCore, formatFn: (nass: string) => string): void => {
    state.footnotes = applyBulkFieldFormatting(state.footnotes, 'nass', formatFn, 'lastUpdatedAt');
    state.lastUpdatedAt = new Date();
};

/**
 * Filters excerpts by IDs
 */
export const filterExcerptsByIds = (state: ExcerptsStateCore, ids?: string[]): void => {
    state.filteredExcerptIds = ids;
};

/**
 * Filters headings by IDs
 */
export const filterHeadingsByIds = (state: ExcerptsStateCore, ids?: string[]): void => {
    state.filteredHeadingIds = ids;
};

/**
 * Filters footnotes by IDs
 */
export const filterFootnotesByIds = (state: ExcerptsStateCore, ids?: string[]): void => {
    state.filteredFootnoteIds = ids;
};

/**
 * Result of applying bulk translations
 */
export type ApplyBulkTranslationsResult = {
    /** Number of translations successfully applied */
    updated: number;
    /** Total number of translations in the input */
    total: number;
};

/**
 * Applies bulk translations to excerpts, headings, and footnotes in a single state update.
 * Uses Map for O(1) lookup to efficiently handle thousands of translations.
 *
 * @param state - The current excerpts state
 * @param translationMap - Map of ID to translation text
 * @param translator - The translator model ID
 * @returns Result with count of updated items and total translations
 */
export const applyBulkTranslations = (
    state: ExcerptsStateCore,
    translationMap: Map<string, string>,
    translator: number,
): ApplyBulkTranslationsResult => {
    const now = nowInSeconds();
    let updated = 0;

    // Build index maps for O(1) lookup of array positions
    const excerptIndexMap = buildIdIndexMap(state.excerpts);
    const headingIndexMap = buildIdIndexMap(state.headings);
    const footnoteIndexMap = buildIdIndexMap(state.footnotes);

    // Apply translations using O(1) lookups
    for (const [id, text] of translationMap) {
        const excerptIndex = excerptIndexMap.get(id);
        if (excerptIndex !== undefined) {
            state.excerpts[excerptIndex] = { ...state.excerpts[excerptIndex], lastUpdatedAt: now, text, translator };
            updated++;
            continue;
        }

        const headingIndex = headingIndexMap.get(id);
        if (headingIndex !== undefined) {
            state.headings[headingIndex] = { ...state.headings[headingIndex], lastUpdatedAt: now, text, translator };
            updated++;
            continue;
        }

        const footnoteIndex = footnoteIndexMap.get(id);
        if (footnoteIndex !== undefined) {
            state.footnotes[footnoteIndex] = {
                ...state.footnotes[footnoteIndex],
                lastUpdatedAt: now,
                text,
                translator,
            };
            updated++;
        }
    }

    if (updated > 0) {
        state.lastUpdatedAt = new Date();
    }

    return { total: translationMap.size, updated };
};

/**
 * Merges multiple adjacent excerpts into one.
 * The first excerpt in the array becomes the merged result.
 * nass and text fields are concatenated with newlines.
 * id, translator fields come from the first excerpt.
 *
 * @param state - The current state
 * @param ids - IDs of adjacent excerpts to merge (must be in order)
 * @returns true if merge was successful
 */
export const mergeExcerpts = (state: ExcerptsStateCore, ids: string[]): boolean => {
    if (ids.length < 2) {
        return false;
    }

    // Find indices of all excerpts to merge
    const indices: number[] = [];
    for (const id of ids) {
        const index = state.excerpts.findIndex((e) => e.id === id);
        if (index === -1) {
            return false; // ID not found
        }
        indices.push(index);
    }

    // Sort indices to ensure proper order
    indices.sort((a, b) => a - b);

    // Verify they are adjacent
    for (let i = 1; i < indices.length; i++) {
        if (indices[i] !== indices[i - 1] + 1) {
            return false; // Not adjacent
        }
    }

    // Get excerpts to merge
    const excerptsToMerge = indices.map((i) => state.excerpts[i]);
    const firstExcerpt = excerptsToMerge[0];

    // Merge fields
    const mergedNass = excerptsToMerge.map((e) => e.nass || '').join('\n');
    const mergedText = excerptsToMerge
        .map((e) => e.text || '')
        .filter(Boolean)
        .join('\n');
    const lastTo = excerptsToMerge[excerptsToMerge.length - 1].to || excerptsToMerge[excerptsToMerge.length - 1].from;

    const now = nowInSeconds();

    // Create merged excerpt (using first excerpt's id and translator)
    const mergedExcerpt: Excerpt = {
        ...firstExcerpt,
        lastUpdatedAt: now,
        nass: mergedNass,
        text: mergedText || firstExcerpt.text,
        to: lastTo !== firstExcerpt.from ? lastTo : firstExcerpt.to,
    };

    // Remove all merged excerpts and insert the merged one at the first position
    const firstIndex = indices[0];
    state.excerpts.splice(firstIndex, indices.length, mergedExcerpt);

    // Update filtered IDs if active
    if (state.filteredExcerptIds) {
        const idsToRemove = new Set(ids.slice(1)); // Keep first ID
        state.filteredExcerptIds = state.filteredExcerptIds.filter((id) => !idsToRemove.has(id));
    }

    state.lastUpdatedAt = new Date();
    return true;
};
