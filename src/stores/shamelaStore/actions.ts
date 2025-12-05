import { sanitizePageContent, splitPageBodyFromFooter } from 'shamela/content';
import type { ShamelaBook, ShamelaPage, ShamelaStateCore, ShamelaTitle } from './types';

/**
 * Returns the current Unix timestamp in seconds.
 */
const nowInSeconds = () => Math.floor(Date.now() / 1000);

/**
 * Initial state for the Shamela store.
 */
export const INITIAL_STATE: ShamelaStateCore = {
    filteredPageIds: undefined,
    filteredTitleIds: undefined,
    inputFileName: undefined,
    lastUpdatedAt: undefined,
    majorRelease: 0,
    pages: [],
    shamelaId: undefined,
    titles: [],
};

/**
 * Parses a page's content into body and footnote sections.
 * Preserves semantic HTML tags (spans, anchor links, hadeeth markers).
 */
const parsePageContent = (content: string): { body: string; footnote?: string } => {
    // Sanitize content (normalize Arabic, etc.) but preserve HTML structure
    const sanitized = sanitizePageContent(content);

    // Split body from footnotes
    const [body, footnote] = splitPageBodyFromFooter(sanitized);

    return { body: body.trim(), footnote: footnote?.trim() || undefined };
};

/**
 * Initializes the store from Shamela book data
 */
export const initStore = (data: ShamelaBook, fileName?: string): ShamelaStateCore => {
    const pages: ShamelaPage[] = data.pages.map((page) => {
        const { body, footnote } = parsePageContent(page.content);
        return { ...page, body, footnote };
    });

    const titles: ShamelaTitle[] = (data.titles ?? []).map((title) => ({ ...title }));

    return {
        ...INITIAL_STATE,
        inputFileName: fileName,
        majorRelease: data.majorRelease,
        pages,
        shamelaId: data.shamelaId,
        titles,
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
        const newBody = updates.body ?? page.body;
        const newFootnote = updates.footnote ?? page.footnote;

        // Reconstruct content from body and footnote
        let content = newBody;
        if (newFootnote) {
            content += `\n_________\n${newFootnote}`;
        }

        state.pages[index] = { ...page, ...updates, content, lastUpdatedAt: nowInSeconds() };
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
