import { adaptExcerptsToLatest } from '@/lib/migration';
import type { Excerpt, Excerpts, ExcerptsStateCore, Heading } from './types';

/**
 * Initializes the store from Excerpts data, migrating if necessary
 */
export const initStore = (data: Excerpts, fileName?: string): ExcerptsStateCore => {
    const migrated = adaptExcerptsToLatest(data);

    return {
        collection: migrated.collection,
        contractVersion: migrated.contractVersion,
        createdAt: migrated.createdAt ? new Date(migrated.createdAt) : new Date(),
        excerpts: [...migrated.excerpts],
        footnotes: [...migrated.footnotes],
        headings: [...migrated.headings],
        inputFileName: fileName,
        lastUpdatedAt: migrated.lastUpdatedAt ? new Date(migrated.lastUpdatedAt) : undefined,
        options: migrated.options,
        postProcessingApps: [],
        prompt: migrated.prompt,
    };
};

/**
 * Updates a single excerpt
 */
export const updateExcerpt = (state: ExcerptsStateCore, id: string, updates: Partial<Omit<Excerpt, 'id'>>): void => {
    const index = state.excerpts.findIndex((e) => e.id === id);
    if (index !== -1) {
        state.excerpts[index] = { ...state.excerpts[index], ...updates, lastUpdatedAt: Date.now() };
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

    const lastUpdatedAt = Date.now() / 1000;

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
        state.headings[index] = { ...state.headings[index], ...updates, lastUpdatedAt: Date.now() };
        state.lastUpdatedAt = new Date();
    }
};

/**
 * Updates a single footnote
 */
export const updateFootnote = (state: ExcerptsStateCore, id: string, updates: Partial<Omit<Excerpt, 'id'>>): void => {
    const index = state.footnotes.findIndex((f) => f.id === id);
    if (index !== -1) {
        state.footnotes[index] = { ...state.footnotes[index], ...updates, lastUpdatedAt: Date.now() };
        state.lastUpdatedAt = new Date();
    }
};

/**
 * Deletes multiple excerpts by ID
 */
export const deleteExcerpts = (state: ExcerptsStateCore, ids: string[]): void => {
    const idSet = new Set(ids);
    state.excerpts = state.excerpts.filter((e) => !idSet.has(e.id));
    state.lastUpdatedAt = new Date();
};

/**
 * Deletes multiple headings by ID
 */
export const deleteHeadings = (state: ExcerptsStateCore, ids: string[]): void => {
    const idSet = new Set(ids);
    state.headings = state.headings.filter((h) => !idSet.has(h.id));
    state.lastUpdatedAt = new Date();
};

/**
 * Deletes multiple footnotes by ID
 */
export const deleteFootnotes = (state: ExcerptsStateCore, ids: string[]): void => {
    const idSet = new Set(ids);
    state.footnotes = state.footnotes.filter((f) => !idSet.has(f.id));
    state.lastUpdatedAt = new Date();
};

/**
 * Applies a formatting function to all excerpt translations in bulk
 */
export const applyTranslationFormatting = (state: ExcerptsStateCore, formatFn: (text: string) => string): void => {
    const now = Date.now();
    state.excerpts = state.excerpts.map((excerpt) => {
        if (excerpt.text) {
            return { ...excerpt, lastUpdatedAt: now, text: formatFn(excerpt.text) };
        }
        return excerpt;
    });
    state.lastUpdatedAt = new Date();
};

/**
 * Applies a formatting function to all heading translations in bulk
 */
export const applyHeadingFormatting = (state: ExcerptsStateCore, formatFn: (text: string) => string): void => {
    const now = Date.now();
    state.headings = state.headings.map((heading) => {
        if (heading.text) {
            return { ...heading, lastUpdatedAt: now, text: formatFn(heading.text) };
        }
        return heading;
    });
    state.lastUpdatedAt = new Date();
};

/**
 * Applies a formatting function to all footnote translations in bulk
 */
export const applyFootnoteFormatting = (state: ExcerptsStateCore, formatFn: (text: string) => string): void => {
    const now = Date.now();
    state.footnotes = state.footnotes.map((footnote) => {
        if (footnote.text) {
            return { ...footnote, lastUpdatedAt: now, text: formatFn(footnote.text) };
        }
        return footnote;
    });
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
