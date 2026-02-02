import { Token } from 'flappa-doormal';
import { LatestContractVersion, SHORT_SEGMENT_WORD_THRESHOLD } from '@/lib/constants';
import { applyBulkFieldFormatting, buildIdIndexMap, deleteItemsByIds, updateItemById } from '@/lib/store-utils';
import { nowInSeconds } from '@/lib/time';
import type { Compilation, Excerpt, ExcerptsStateCore, Heading } from './types';

/**
 * Initial state for the excerpts store.
 * Used by both initStore and reset to ensure consistency.
 */
export const INITIAL_STATE: ExcerptsStateCore = {
    collection: undefined,
    contractVersion: LatestContractVersion.Excerpts,
    createdAt: nowInSeconds(),
    excerpts: [],
    filteredExcerptIds: undefined,
    filteredFootnoteIds: undefined,
    filteredHeadingIds: undefined,
    footnotes: [],
    headings: [],
    inputFileName: undefined,
    lastUpdatedAt: nowInSeconds(),
    options: {
        breakpoints: [{ pattern: Token.TARQIM }, ''],
        maxPages: 1,
        minWordsPerSegment: SHORT_SEGMENT_WORD_THRESHOLD,
        replace: [],
        rules: [],
    },
    postProcessingApps: [],
    promptForTranslation: '',
    promptId: undefined,
    sentToLlmIds: new Set(),
};

/**
 * Initializes the store from Excerpts data, migrating if necessary
 */
export const initStore = (migrated: Compilation, fileName?: string): ExcerptsStateCore => {
    // Migration: move top-level replace to options.replace
    const options = migrated.options || {};

    return {
        ...INITIAL_STATE,
        collection: migrated.collection,
        contractVersion: migrated.contractVersion,
        createdAt: migrated.createdAt,
        excerpts: [...migrated.excerpts],
        footnotes: [...migrated.footnotes],
        headings: [...migrated.headings],
        inputFileName: fileName,
        lastUpdatedAt: migrated.lastUpdatedAt,
        options,
        postProcessingApps: migrated.postProcessingApps,
        promptForTranslation: migrated.promptForTranslation || '',
        promptId: migrated.promptId,
    };
};

/**
 * Resets the store to initial state
 */
export const resetStore = (): ExcerptsStateCore => ({ ...INITIAL_STATE, createdAt: nowInSeconds() });

/**
 * Sets the active translation prompt
 */
export const setPrompt = (state: ExcerptsStateCore, promptId: string, content: string): void => {
    state.promptId = promptId;
    state.promptForTranslation = content;
    state.lastUpdatedAt = nowInSeconds();
};

/**
 * Updates a single excerpt
 */
export const updateExcerpt = (state: ExcerptsStateCore, id: string, updates: Partial<Omit<Excerpt, 'id'>>): void => {
    if (updateItemById(state.excerpts, id, updates, 'lastUpdatedAt')) {
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
};

/**
 * Updates a single heading
 */
export const updateHeading = (state: ExcerptsStateCore, id: string, updates: Partial<Omit<Heading, 'id'>>): void => {
    updateItemById(state.headings, id, updates, 'lastUpdatedAt');
};

/**
 * Updates a single footnote
 */
export const updateFootnote = (state: ExcerptsStateCore, id: string, updates: Partial<Omit<Excerpt, 'id'>>): void => {
    updateItemById(state.footnotes, id, updates, 'lastUpdatedAt');
};

/**
 * Deletes multiple excerpts by ID
 */
export const deleteExcerpts = (state: ExcerptsStateCore, ids: string[]): void => {
    state.excerpts = deleteItemsByIds(state.excerpts, ids);
};

/**
 * Deletes multiple headings by ID
 */
export const deleteHeadings = (state: ExcerptsStateCore, ids: string[]): void => {
    state.headings = deleteItemsByIds(state.headings, ids);
};

/**
 * Deletes multiple footnotes by ID
 */
export const deleteFootnotes = (state: ExcerptsStateCore, ids: string[]): void => {
    state.footnotes = deleteItemsByIds(state.footnotes, ids);
};

/**
 * Applies a formatting function to all excerpt translations in bulk
 */
export const applyTranslationFormatting = (state: ExcerptsStateCore, formatFn: (text: string) => string): void => {
    state.excerpts = applyBulkFieldFormatting(state.excerpts, 'text', formatFn, 'lastUpdatedAt');
};

/**
 * Applies a formatting function to all heading translations in bulk
 */
export const applyHeadingFormatting = (state: ExcerptsStateCore, formatFn: (text: string) => string): void => {
    state.headings = applyBulkFieldFormatting(state.headings, 'text', formatFn, 'lastUpdatedAt');
};

/**
 * Applies a formatting function to all footnote translations in bulk
 */
export const applyFootnoteFormatting = (state: ExcerptsStateCore, formatFn: (text: string) => string): void => {
    state.footnotes = applyBulkFieldFormatting(state.footnotes, 'text', formatFn, 'lastUpdatedAt');
};

/**
 * Applies a formatting function to all excerpt nass (Arabic) in bulk
 */
export const applyExcerptNassFormatting = (state: ExcerptsStateCore, formatFn: (nass: string) => string): void => {
    state.excerpts = applyBulkFieldFormatting(state.excerpts, 'nass', formatFn, 'lastUpdatedAt');
};

/**
 * Applies a formatting function to all heading nass (Arabic) in bulk
 */
export const applyHeadingNassFormatting = (state: ExcerptsStateCore, formatFn: (nass: string) => string): void => {
    state.headings = applyBulkFieldFormatting(state.headings, 'nass', formatFn, 'lastUpdatedAt');
};

/**
 * Applies a formatting function to all footnote nass (Arabic) in bulk
 */
export const applyFootnoteNassFormatting = (state: ExcerptsStateCore, formatFn: (nass: string) => string): void => {
    state.footnotes = applyBulkFieldFormatting(state.footnotes, 'nass', formatFn, 'lastUpdatedAt');
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

    return true;
};

/**
 * Mark excerpts as sent to LLM for translation
 */
export const markAsSentToLlm = (state: ExcerptsStateCore, ids: string[]): void => {
    for (const id of ids) {
        state.sentToLlmIds.add(id);
    }
};

/**
 * Reset sent-to-LLM tracking to sync with current untranslated state
 */
export const resetSentToLlm = (state: ExcerptsStateCore): void => {
    state.sentToLlmIds = new Set();
};
