'use client';

import { getBookContents } from 'ketab-online-sdk';
import { Loader2 } from 'lucide-react';
import { record } from 'nanolytics';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import '@/lib/analytics';
import { toast } from 'sonner';
import { DataGate } from '@/components/data-gate';
import JsonDropZone from '@/components/json-drop-zone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadFromOPFS } from '@/lib/io';
import {
    createPageSelector,
    createTitleSelector,
    selectPageCount,
    selectTitleCount,
} from '@/stores/ketabStore/selectors';
import type { KetabBook } from '@/stores/ketabStore/types';
import { useKetabStore } from '@/stores/ketabStore/useKetabStore';
import VirtualizedList from '../excerpts/virtualized-list';
import PageRow from './page-row';
import KetabTableHeader from './table-header';
import TitleRow from './title-row';
import { Toolbar } from './toolbar';
import { useKetabFilters } from './use-ketab-filters';

/**
 * Extracts book ID from a ketabonline.com URL.
 * Supports formats like:
 * - https://ketabonline.com/ar/books/2122
 * - https://ketabonline.com/en/books/2122
 * - ketabonline.com/ar/books/2122
 */
function extractBookIdFromUrl(url: string): number | null {
    // Match /books/{id} pattern
    const match = url.match(/\/books\/(\d+)/i);
    if (match?.[1]) {
        return parseInt(match[1], 10);
    }
    // Also try just a plain number
    const plainNumber = url.trim().match(/^(\d+)$/);
    if (plainNumber?.[1]) {
        return parseInt(plainNumber[1], 10);
    }
    return null;
}

/**
 * Inner component that uses store state
 */
function KetabPageContent() {
    const init = useKetabStore((state) => state.init);
    const pages = useKetabStore(createPageSelector);
    const titles = useKetabStore(createTitleSelector);
    const allPages = useKetabStore((state) => state.pages);
    const allTitles = useKetabStore((state) => state.titles);
    const pagesCount = useKetabStore(selectPageCount);
    const titlesCount = useKetabStore(selectTitleCount);
    const bookTitle = useKetabStore((state) => state.bookTitle);
    const bookId = useKetabStore((state) => state.bookId);
    const updatePage = useKetabStore((state) => state.updatePage);
    const updateTitle = useKetabStore((state) => state.updateTitle);

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const hasAutoLoaded = useRef(false);
    const [urlInput, setUrlInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { activeTab, clearScrollTo, filters, navigateToItem, scrollToId, setActiveTab, setFilter } =
        useKetabFilters();
    const hasData = pagesCount > 0 || titlesCount > 0;

    useEffect(() => {
        loadFromOPFS('ketab').then((data) => {
            if (data) {
                record('RestoreKetabFromSession');
                init(data as KetabBook);
            }
        });
    }, [init]);

    const handleTabChange = useCallback(
        (tab: string) => {
            setActiveTab(tab as 'pages' | 'titles');
        },
        [setActiveTab],
    );

    /**
     * Navigate to a specific page in the Pages tab.
     * This is used when clicking Page links in the Titles tab.
     */
    const handleNavigateToPage = useCallback(
        (pageId: number) => {
            navigateToItem('pages', pageId);
        },
        [navigateToItem],
    );

    /**
     * Fetch book directly from ketabonline.com
     */
    const handleFetchBook = useCallback(async () => {
        const bookId = extractBookIdFromUrl(urlInput);
        if (!bookId) {
            toast.error('Invalid URL. Please enter a valid ketabonline.com book URL or book ID.');
            return;
        }

        setIsLoading(true);
        try {
            record('FetchKetabFromUrl', String(bookId));
            toast.info(`Fetching book ${bookId}...`);

            const data = await getBookContents(bookId);

            if (data?.pages && data?.index) {
                init(data as unknown as KetabBook, `ketabonline-${bookId}.json`);
                toast.success(`Loaded "${data.title || 'Book'}" (${data.pages.length} pages)`);
            } else {
                toast.error('Invalid book data received.');
            }
        } catch (error) {
            console.error('Failed to fetch book:', error);
            toast.error(`Failed to fetch book: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    }, [urlInput, init]);

    return (
        <DataGate
            dropZone={
                <div className="flex flex-col gap-6">
                    {/* URL Input */}
                    <div className="mx-auto w-full max-w-xl">
                        <label className="mb-2 block font-medium text-gray-700 text-sm">
                            Or paste a ketabonline.com URL
                        </label>
                        <div className="flex gap-2">
                            <Input
                                className="flex-1"
                                disabled={isLoading}
                                onChange={(e) => setUrlInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && urlInput.trim()) {
                                        handleFetchBook();
                                    }
                                }}
                                placeholder="https://ketabonline.com/ar/books/2122 or just 2122"
                                type="text"
                                value={urlInput}
                            />
                            <Button disabled={isLoading || !urlInput.trim()} onClick={handleFetchBook}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    'Fetch'
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="text-center text-gray-400 text-sm">— or —</div>

                    <JsonDropZone
                        description="Drag and drop a Ketab Online book JSON file"
                        maxFiles={1}
                        onFiles={(fileNameToData) => {
                            const keys = Object.keys(fileNameToData);
                            const data = fileNameToData[keys[0]];

                            // Validate basic structure before casting
                            if (typeof data === 'object' && 'pages' in data && 'index' in data) {
                                record('LoadKetab', keys[0]);
                                init(data as unknown as KetabBook, keys[0]);
                            } else {
                                toast.error('Invalid Ketab book format. Expected pages and index fields.');
                            }
                        }}
                    />
                </div>
            }
            hasData={hasData}
        >
            <div className="flex min-h-screen flex-col font-[family-name:var(--font-geist-sans)]">
                <div className="w-full">
                    <div className="sticky top-0 z-20 flex items-center justify-between border-gray-200 border-b bg-white px-4 py-3 shadow-sm">
                        <div>
                            <h1 className="font-bold text-gray-800 text-xl">Ketab Editor</h1>
                            <span className="text-gray-500 text-sm">
                                {bookTitle && `${bookTitle}`}
                                {bookId && ` • Book ID: ${bookId}`}
                            </span>
                        </div>
                        <Toolbar />
                    </div>

                    <div className="w-full">
                        <Tabs className="w-full" onValueChange={handleTabChange} value={activeTab}>
                            <TabsList className="w-full justify-start rounded-none border-gray-200 border-b bg-white">
                                <TabsTrigger value="pages">
                                    Pages
                                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 text-xs">
                                        {pagesCount}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger value="titles">
                                    Titles
                                    <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-purple-700 text-xs">
                                        {titlesCount}
                                    </span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent className="mt-0" value="pages">
                                <VirtualizedList
                                    data={pages}
                                    getKey={(item) => item.id}
                                    header={
                                        <KetabTableHeader
                                            activeTab="pages"
                                            filters={filters}
                                            onFilterChange={setFilter}
                                            pages={allPages}
                                            titles={allTitles}
                                        />
                                    }
                                    onScrollToComplete={clearScrollTo}
                                    renderRow={(item) => <PageRow data={item} onUpdate={updatePage} bookId={bookId} />}
                                    scrollToId={scrollToId}
                                />
                            </TabsContent>

                            <TabsContent className="mt-0" value="titles">
                                <VirtualizedList
                                    data={titles}
                                    getKey={(item) => item.id}
                                    header={
                                        <KetabTableHeader
                                            activeTab="titles"
                                            filters={filters}
                                            onFilterChange={setFilter}
                                            pages={allPages}
                                            titles={allTitles}
                                        />
                                    }
                                    renderRow={(item) => (
                                        <TitleRow
                                            allTitles={allTitles}
                                            data={item}
                                            onNavigateToPage={handleNavigateToPage}
                                            onUpdate={updateTitle}
                                            bookId={bookId}
                                        />
                                    )}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </DataGate>
    );
}

/**
 * Ketab book editor page with virtualized lists for large datasets
 */
export default function KetabPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <KetabPageContent />
        </Suspense>
    );
}
