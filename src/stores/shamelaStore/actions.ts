import { removeFootnoteReferencesSimple, removeSingleDigitFootnoteReferences } from 'baburchi';
import { removeArabicNumericPageMarkers, splitPageBodyFromFooter } from 'shamela/content';
import type { ShamelaBook, ShamelaPage, ShamelaStateCore, ShamelaTitle } from './types';

/**
 * Returns the current Unix timestamp in seconds.
 */
const nowInSeconds = () => Math.floor(Date.now() / 1000);

/**
 * Initial state for the Shamela store.
 */
export const INITIAL_STATE: ShamelaStateCore = { majorRelease: 0, pages: [], titles: [] };

/**
 * Initializes the store from Shamela book data
 */
export const initStore = (data: ShamelaBook, fileName?: string): ShamelaStateCore => {
    const pages: ShamelaPage[] = data.pages.map(({ content, ...page }) => {
        const [body, footnote] = splitPageBodyFromFooter(content);
        return { ...page, body, footnote };
    });

    return {
        ...INITIAL_STATE,
        inputFileName: fileName,
        majorRelease: data.majorRelease,
        pages,
        shamelaId: data.shamelaId,
        titles: data.titles || [],
    };
};

/**
 * Resets the store to initial state
 */
export const resetStore = (): ShamelaStateCore => ({ ...INITIAL_STATE });

/**
 * Updates a single page
 */
export const updatePage = (state: ShamelaStateCore, id: number, updates: Partial<Omit<ShamelaPage, 'id'>>): void => {
    const index = state.pages.findIndex((p) => p.id === id);
    if (index !== -1) {
        // When body or footnote is updated, reconstruct the content field
        const page = state.pages[index];
        state.pages[index] = { ...page, ...updates, lastUpdatedAt: nowInSeconds() };
        state.lastUpdatedAt = new Date();
    }
};

/**
 * Updates a single title
 */
export const updateTitle = (state: ShamelaStateCore, id: number, updates: Partial<Omit<ShamelaTitle, 'id'>>): void => {
    const index = state.titles.findIndex((t) => t.id === id);
    if (index !== -1) {
        state.titles[index] = { ...state.titles[index], ...updates, lastUpdatedAt: nowInSeconds() };
        state.lastUpdatedAt = new Date();
    }
};

/**
 * Deletes a page by ID
 */
export const deletePage = (state: ShamelaStateCore, id: number): void => {
    state.pages = state.pages.filter((p) => p.id !== id);
    state.lastUpdatedAt = new Date();
};

/**
 * Deletes a title by ID
 */
export const deleteTitle = (state: ShamelaStateCore, id: number): void => {
    state.titles = state.titles.filter((t) => t.id !== id);
    state.lastUpdatedAt = new Date();
};

/**
 * Filters pages by IDs
 */
export const filterPagesByIds = (state: ShamelaStateCore, ids?: number[]): void => {
    state.filteredPageIds = ids;
};

/**
 * Filters titles by IDs
 */
export const filterTitlesByIds = (state: ShamelaStateCore, ids?: number[]): void => {
    state.filteredTitleIds = ids;
};

/**
 * Removes Arabic numeric page markers from all pages in a single batch update
 */
export const removePageMarkers = (state: ShamelaStateCore): void => {
    for (const page of state.pages) {
        const cleanedBody = removeArabicNumericPageMarkers(page.body);
        if (cleanedBody !== page.body) {
            page.body = cleanedBody;
            page.lastUpdatedAt = Math.floor(Date.now() / 1000);
        }
    }

    state.lastUpdatedAt = new Date();
};

/**
 * Removes footnote references from page bodies and clears footnote content.
 * Uses baburchi's removeSingleDigitFootnoteReferences and removeFootnoteReferencesSimple.
 */
export const removeFootnoteReferences = (state: ShamelaStateCore): void => {
    const now = nowInSeconds();

    for (const page of state.pages) {
        let cleanedBody = page.body;

        // Apply both removal functions
        cleanedBody = removeSingleDigitFootnoteReferences(cleanedBody);
        cleanedBody = removeFootnoteReferencesSimple(cleanedBody);

        const hasChanges = cleanedBody !== page.body || page.footnote;

        if (hasChanges) {
            page.body = cleanedBody;
            page.footnote = undefined;
            page.lastUpdatedAt = now;
        }
    }

    state.lastUpdatedAt = new Date();
};
