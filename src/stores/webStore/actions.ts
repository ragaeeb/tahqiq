import { deleteItemsByIds } from '@/lib/store-utils';
import { nowInSeconds } from '@/lib/time';
import type { WebBook, WebPage, WebStateCore, WebTitle } from './types';

/**
 * Initial state for the Web store.
 */
export const INITIAL_STATE: WebStateCore = { pages: [], titles: [] };

/**
 * Initializes the store from Web book data
 */
export const initStore = (data: WebBook, fileName?: string): WebStateCore => {
    const pages: WebPage[] = data.pages.map((p) => ({
        ...(p.accessed && { accessed: p.accessed }),
        body: p.body,
        ...(p.footnote && { footnote: p.footnote }),
        id: p.page,
        ...(p.title && { pageTitle: p.title }),
        ...(p.url && { url: p.url }),
    }));

    // Extract titles from pages that have a title property
    const titles: WebTitle[] = data.pages
        .filter((p) => p.title)
        .map((p) => ({ content: p.title!, id: p.page, page: p.page }));

    return {
        ...INITIAL_STATE,
        inputFileName: fileName,
        pages,
        ...(data.scrapingEngine && { scrapingEngine: data.scrapingEngine }),
        titles,
        ...(data.urlPattern && { urlPattern: data.urlPattern }),
    };
};

/**
 * Resets the store to initial state
 */
export const resetStore = (): WebStateCore => ({ ...INITIAL_STATE });

/**
 * Updates a single page
 */
export const updatePage = (state: WebStateCore, id: number, updates: Partial<Omit<WebPage, 'id'>>): void => {
    const index = state.pages.findIndex((p) => p.id === id);
    if (index !== -1) {
        const page = state.pages[index];
        state.pages[index] = { ...page, ...updates, lastUpdatedAt: nowInSeconds() };
        state.lastUpdatedAt = new Date();
    }
};

/**
 * Updates a single title
 */
export const updateTitle = (state: WebStateCore, id: number, updates: Partial<Omit<WebTitle, 'id'>>): void => {
    const index = state.titles.findIndex((t) => t.id === id);
    if (index !== -1) {
        state.titles[index] = { ...state.titles[index], ...updates, lastUpdatedAt: nowInSeconds() };
        state.lastUpdatedAt = new Date();
    }
};

/**
 * Deletes a page by ID
 */
export const deletePage = (state: WebStateCore, id: number): void => {
    state.pages = deleteItemsByIds(state.pages, [id]);
    state.lastUpdatedAt = new Date();
};

/**
 * Deletes a title by ID
 */
export const deleteTitle = (state: WebStateCore, id: number): void => {
    state.titles = deleteItemsByIds(state.titles, [id]);
    state.lastUpdatedAt = new Date();
};

/**
 * Filters pages by IDs
 */
export const filterPagesByIds = (state: WebStateCore, ids?: number[]): void => {
    state.filteredPageIds = ids;
};

/**
 * Filters titles by IDs
 */
export const filterTitlesByIds = (state: WebStateCore, ids?: number[]): void => {
    state.filteredTitleIds = ids;
};

/**
 * Removes footnote content from all pages
 */
export const removeFootnotes = (state: WebStateCore): void => {
    const now = nowInSeconds();

    for (const page of state.pages) {
        if (page.footnote) {
            page.footnote = undefined;
            page.lastUpdatedAt = now;
        }
    }

    state.lastUpdatedAt = new Date();
};
