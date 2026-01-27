'use client';

import { record } from 'nanolytics';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import '@/lib/analytics';
import { DataGate } from '@/components/data-gate';
import JsonDropZone from '@/components/json-drop-zone';
import SubmittableInput from '@/components/submittable-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadFromOPFS } from '@/lib/io';
import { usePatchStore } from '@/stores/patchStore';
import { useSettingsStore } from '@/stores/settingsStore/useSettingsStore';
import { selectAllPages, selectAllTitles, selectPageCount, selectTitleCount } from '@/stores/shamelaStore/selectors';
import type { ShamelaBook } from '@/stores/shamelaStore/types';
import { useShamelaStore } from '@/stores/shamelaStore/useShamelaStore';
import VirtualizedList from '../excerpts/virtualized-list';
import PageRow from './page-row';
import ShamelaTableHeader from './table-header';
import TitleRow from './title-row';
import { Toolbar } from './toolbar';
import { useShamelaFilters } from './use-shamela-filters';

/**
 * Reads a streaming response and reconstructs the JSON
 */
async function readStreamedJson<T>(response: Response): Promise<T> {
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let result = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            result += decoder.decode(value, { stream: true });
        }
        // Final decode to flush any remaining bytes
        result += decoder.decode();

        return JSON.parse(result);
    } finally {
        reader.releaseLock();
    }
}

/**
 * Inner component that uses store state
 */
function ShamelaPageContent() {
    const init = useShamelaStore((state) => state.init);
    const pages = useShamelaStore(selectAllPages);
    const titles = useShamelaStore(selectAllTitles);
    const allPages = useShamelaStore((state) => state.pages);
    const allTitles = useShamelaStore((state) => state.titles);
    const pagesCount = useShamelaStore(selectPageCount);
    const titlesCount = useShamelaStore(selectTitleCount);
    const majorRelease = useShamelaStore((state) => state.majorRelease);
    const shamelaId = useShamelaStore((state) => state.shamelaId);
    const updatePage = useShamelaStore((state) => state.updatePage);
    const updateTitle = useShamelaStore((state) => state.updateTitle);

    const setBookId = usePatchStore((state) => state.setBookId);

    const hydrateSettings = useSettingsStore((state) => state.hydrate);
    const shamelaApiKey = useSettingsStore((state) => state.shamelaApiKey);
    const shamelaBookEndpoint = useSettingsStore((state) => state.shamelaBookEndpoint);

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [isLoading, setIsLoading] = useState(false);
    const hasAutoLoaded = useRef(false);

    const { activeTab, clearScrollTo, filters, navigateToItem, scrollToId, setActiveTab, setFilter } =
        useShamelaFilters();
    const hasData = pagesCount > 0 || titlesCount > 0;

    useEffect(() => {
        hydrateSettings();
        loadFromOPFS('shamela').then((data) => {
            if (data) {
                record('RestoreShamelaFromSession');
                setBookId((data as ShamelaBook).shamelaId);
                init(data as ShamelaBook);
            }
        });
    }, [init, hydrateSettings, setBookId]);

    const handleTabChange = useCallback(
        (tab: string) => {
            setActiveTab(tab as 'pages' | 'titles');
        },
        [setActiveTab],
    );

    /**
     * Navigate to a specific page in the Pages tab.
     * This is used when clicking Page or Parent links in the Titles tab.
     */
    const handleNavigateToPage = useCallback(
        (pageId: number) => {
            navigateToItem('pages', pageId);
        },
        [navigateToItem],
    );

    const handleUrlSubmit = useCallback(
        async (url: string) => {
            if (/^\d+$/.test(url)) {
                url = `https://shamela.ws/book/${url}`;
            }

            // Parse book ID from URL like https://shamela.ws/book/1681
            const match = url.match(/shamela\.ws\/book\/(\d+)/);
            if (!match) {
                toast.error('Invalid Shamela URL. Expected format: https://shamela.ws/book/1681');
                return;
            }

            const bookId = parseInt(match[1], 10);

            // Update URL with the shamela URL param for bookmarking/sharing
            const params = new URLSearchParams(searchParams.toString());
            params.set('url', url);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });

            setIsLoading(true);
            record('DownloadShamelaBook', bookId.toString());

            try {
                const response = await fetch(`/api/shamela?bookId=${bookId}`, {
                    headers: { Authorization: `Bearer ${shamelaApiKey}`, 'X-Shamela-Endpoint': shamelaBookEndpoint },
                });

                if (!response.ok) {
                    // For non-streaming errors (validation failures), we can still read as JSON
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to download book');
                }

                // Read the streamed response
                const book = await readStreamedJson<ShamelaBook>(response);

                // Check if response contains an error
                if ('error' in book) {
                    throw new Error((book as { error: string }).error);
                }

                setBookId(book.shamelaId);
                init(book, `shamela-${bookId}.json`);
                toast.success(`Downloaded book ${bookId} from Shamela`);
            } catch (error) {
                console.error('Failed to download book:', error);
                toast.error(error instanceof Error ? error.message : 'Failed to download book');
            } finally {
                setIsLoading(false);
            }
        },
        [init, shamelaApiKey, shamelaBookEndpoint, searchParams, router, pathname, setBookId],
    );

    // Auto-load book from URL param if present (only once per mount)
    useEffect(() => {
        const urlParam = searchParams.get('url');
        if (urlParam && !hasAutoLoaded.current && shamelaApiKey && shamelaBookEndpoint) {
            hasAutoLoaded.current = true;
            // Defer to next tick to ensure settings are hydrated
            setTimeout(() => {
                handleUrlSubmit(urlParam);
            }, 0);
        }
    }, [searchParams, shamelaApiKey, shamelaBookEndpoint, handleUrlSubmit]);

    const canDownloadFromShamela = shamelaApiKey && shamelaBookEndpoint;

    return (
        <DataGate
            dropZone={
                <div className="flex flex-col gap-6">
                    {canDownloadFromShamela && (
                        <>
                            <div className="space-y-2">
                                <p className="font-medium text-gray-700 text-sm">Download from Shamela URL</p>
                                <SubmittableInput
                                    className="w-full"
                                    disabled={isLoading}
                                    name="shamelaUrl"
                                    onSubmit={handleUrlSubmit}
                                    placeholder="Paste shamela.ws URL (e.g. https://shamela.ws/book/1681)"
                                />
                                {isLoading && <p className="text-gray-500 text-sm">Downloading book...</p>}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500">Or</span>
                                </div>
                            </div>
                        </>
                    )}
                    <JsonDropZone
                        description="Drag and drop a Shamela book JSON file"
                        maxFiles={1}
                        onFiles={(fileNameToData) => {
                            const keys = Object.keys(fileNameToData);
                            const data = fileNameToData[keys[0]];

                            // Validate basic structure before casting
                            if (typeof data === 'object' && 'pages' in data) {
                                record('LoadShamela', keys[0]);
                                init(data as unknown as ShamelaBook, keys[0]);
                            } else {
                                toast.error('Invalid Shamela book format');
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
                            <h1 className="font-bold text-gray-800 text-xl">Shamela Editor</h1>
                            <span className="text-gray-500 text-sm">
                                Version: {majorRelease}
                                {shamelaId && ` • Book ID: ${shamelaId}`}
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
                                        <ShamelaTableHeader
                                            activeTab="pages"
                                            filters={filters}
                                            onFilterChange={setFilter}
                                            pages={allPages}
                                            titles={allTitles}
                                        />
                                    }
                                    onScrollToComplete={clearScrollTo}
                                    renderRow={(item) => (
                                        <PageRow data={item} onUpdate={updatePage} shamelaId={shamelaId} />
                                    )}
                                    scrollToId={scrollToId}
                                />
                            </TabsContent>

                            <TabsContent className="mt-0" value="titles">
                                <VirtualizedList
                                    data={titles}
                                    getKey={(item) => item.id}
                                    header={
                                        <ShamelaTableHeader
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
                                            shamelaId={shamelaId}
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
 * Shamela book editor page with virtualized lists for large datasets
 */
export default function ShamelaPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <ShamelaPageContent />
        </Suspense>
    );
}
