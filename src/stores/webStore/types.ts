import type { PostProcessingApp } from '../commonTypes';

type PageMetadata = Record<string, unknown> & {
    book?: string;
    chapter?: string;

    footnotes?: string;

    /** To group multiple pages under the same title. */
    group?: number;

    index?: string;
    /** 16-08-2004 */
    publishDate?: string;

    /** Date.now()/1000 */
    publishedAt?: number;

    part?: number;

    url?: string;

    /** Audio timecode in seconds */
    t?: number;
};

export type WebPage = {
    /** Date.now()/1000 */
    accessedAt: number;

    /**
     * Freeform
     * {
        "book": "سلسلة الهدى والنور",
        "chapter": "سلسلة الهدى والنور-001"
      }
     */
    metadata?: PageMetadata;
    id: number;

    content?: string;

    title?: string;
};

export type ScrapingEngine = { name: string; version: string };

export type ScrapeResult = {
    contractVersion: string;
    pages: WebPage[];
    type: 'web';
    scrapingEngine?: ScrapingEngine;
    createdAt: number;
    urlPattern: string;
    lastUpdatedAt: number;
    postProcessingApps: PostProcessingApp[];
};

type IdFilters = {
    /** Filtered page IDs (undefined = show all) */
    filteredPageIds: number[];
    /** Filtered title IDs (undefined = show all) */
    filteredTitleIds: number[];
};

/**
 * Core state for Web editor
 */
export type WebStateCore = IdFilters & ScrapeResult;

type FilterActions = {
    /**
     * Filters pages by IDs (undefined clears filter)
     */
    filterPagesByIds: (ids: number[]) => void;

    /**
     * Filters titles by IDs (undefined clears filter)
     */
    filterTitlesByIds: (ids: number[]) => void;
};

/**
 * Actions available for Web editor
 */
export type WebActions = FilterActions & {
    /**
     * Initializes the store from Web book data
     */
    init: (data: ScrapeResult) => void;

    /**
     * Removes footnote content from all pages
     */
    removeFootnotes: () => void;

    /**
     * Resets the store to initial empty state
     */
    reset: () => void;
};

/**
 * Complete state including core data and actions
 */
export type WebState = WebActions & WebStateCore;
