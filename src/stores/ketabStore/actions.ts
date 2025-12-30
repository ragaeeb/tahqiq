import {
    htmlToMarkdown,
    removeFootnoteReferences as removeFootnoteRefsFromHtml,
    splitPageFootnotes,
    stripHtmlTags,
} from 'ketab-online-sdk';
import { deleteItemsByIds } from '@/lib/store-utils';
import { nowInSeconds } from '@/lib/time';
import type { KetabBook, KetabPage, KetabStateCore, KetabTitle } from './types';

/**
 * Initial state for the Ketab store.
 */
export const INITIAL_STATE: KetabStateCore = { pages: [], titles: [] };

/**
 * Flattens the hierarchical index into a flat list of titles with depth info
 */
const flattenIndexWithDepth = (index: KetabBook['index'], depth = 0): KetabTitle[] => {
    const result: KetabTitle[] = [];

    for (const item of index) {
        result.push({ ...item, depth });
        if (item.children && item.children.length > 0) {
            result.push(...flattenIndexWithDepth(item.children, depth + 1));
        }
    }

    return result;
};

/**
 * Initializes the store from Ketab book data
 */
export const initStore = (data: KetabBook, fileName?: string): KetabStateCore => {
    const pages: KetabPage[] = data.pages.map(({ content, ...page }) => {
        const [body, footnote] = splitPageFootnotes(content);
        return { ...page, body, footnote: footnote || undefined };
    });

    const titles = flattenIndexWithDepth(data.index);

    return { ...INITIAL_STATE, bookId: data.id, bookTitle: data.title, inputFileName: fileName, pages, titles };
};

/**
 * Resets the store to initial state
 */
export const resetStore = (): KetabStateCore => ({ ...INITIAL_STATE });

/**
 * Updates a single page
 */
export const updatePage = (state: KetabStateCore, id: number, updates: Partial<Omit<KetabPage, 'id'>>): void => {
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
export const updateTitle = (state: KetabStateCore, id: number, updates: Partial<Omit<KetabTitle, 'id'>>): void => {
    const index = state.titles.findIndex((t) => t.id === id);
    if (index !== -1) {
        state.titles[index] = { ...state.titles[index], ...updates, lastUpdatedAt: nowInSeconds() };
        state.lastUpdatedAt = new Date();
    }
};

/**
 * Deletes a page by ID
 */
export const deletePage = (state: KetabStateCore, id: number): void => {
    state.pages = deleteItemsByIds(state.pages, [id]);
    state.lastUpdatedAt = new Date();
};

/**
 * Deletes a title by ID
 */
export const deleteTitle = (state: KetabStateCore, id: number): void => {
    state.titles = deleteItemsByIds(state.titles, [id]);
    state.lastUpdatedAt = new Date();
};

/**
 * Filters pages by IDs
 */
export const filterPagesByIds = (state: KetabStateCore, ids?: number[]): void => {
    state.filteredPageIds = ids;
};

/**
 * Filters titles by IDs
 */
export const filterTitlesByIds = (state: KetabStateCore, ids?: number[]): void => {
    state.filteredTitleIds = ids;
};

/**
 * Removes footnote references from page bodies and clears footnote content.
 * Uses ketab-online-sdk's removeFootnoteReferences function.
 */
export const removeFootnoteReferences = (state: KetabStateCore): void => {
    const now = nowInSeconds();

    for (const page of state.pages) {
        let cleanedBody = page.body;

        // Remove footnote references from HTML
        cleanedBody = removeFootnoteRefsFromHtml(cleanedBody);

        const hasChanges = cleanedBody !== page.body || page.footnote;

        if (hasChanges) {
            page.body = cleanedBody;
            page.footnote = undefined;
            page.lastUpdatedAt = now;
        }
    }

    state.lastUpdatedAt = new Date();
};

/**
 * Converts HTML content in page bodies to markdown/plain text
 */
export const convertToMarkdown = (state: KetabStateCore): void => {
    const now = nowInSeconds();

    for (const page of state.pages) {
        const markdownBody = htmlToMarkdown(page.body);

        if (markdownBody !== page.body) {
            page.body = markdownBody;
            page.lastUpdatedAt = now;
        }

        if (page.footnote) {
            const markdownFootnote = stripHtmlTags(page.footnote);
            if (markdownFootnote !== page.footnote) {
                page.footnote = markdownFootnote;
                page.lastUpdatedAt = now;
            }
        }
    }

    state.lastUpdatedAt = new Date();
};
