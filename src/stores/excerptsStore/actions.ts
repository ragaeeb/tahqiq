import type { Entry, Excerpts, ExcerptsStateCore, Footnote, Heading } from './types';

/**
 * Initializes the store from Excerpts data
 */
export const initStore = (data: Excerpts, fileName?: string): ExcerptsStateCore => {
    return {
        collection: data.collection,
        contractVersion: data.contractVersion,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        excerpts: [...data.excerpts],
        footnotes: [...data.footnotes],
        headings: [...data.headings],
        inputFileName: fileName,
        lastUpdatedAt: data.lastUpdatedAt ? new Date(data.lastUpdatedAt) : undefined,
        options: data.options,
        postProcessingApps: [],
        prompt: data.prompt,
    };
};

/**
 * Updates a single excerpt
 */
export const updateExcerpt = (state: ExcerptsStateCore, id: string, updates: Partial<Omit<Entry, 'id'>>): void => {
    const index = state.excerpts.findIndex((e) => e.id === id);
    if (index !== -1) {
        state.excerpts[index] = { ...state.excerpts[index], ...updates, lastUpdatedAt: Date.now() };
        state.lastUpdatedAt = new Date();
    }
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
export const updateFootnote = (state: ExcerptsStateCore, id: string, updates: Partial<Omit<Footnote, 'id'>>): void => {
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
        if (excerpt.translation) {
            return { ...excerpt, lastUpdatedAt: now, translation: formatFn(excerpt.translation) };
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
