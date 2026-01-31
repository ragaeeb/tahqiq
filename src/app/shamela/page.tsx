'use client';

import { record } from 'nanolytics';
import { Suspense, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import '@/lib/analytics';
import { DataGate } from '@/components/data-gate';
import { DatasetLoader } from '@/components/dataset-loader';
import JsonDropZone from '@/components/json-drop-zone';
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
    const version = useShamelaStore((state) => state.version);
    const shamelaId = useShamelaStore((state) => state.shamelaId);
    const updatePage = useShamelaStore((state) => state.updatePage);
    const updateTitle = useShamelaStore((state) => state.updateTitle);

    const setBookId = usePatchStore((state) => state.setBookId);

    const hydrateSettings = useSettingsStore((state) => state.hydrate);

    const { activeTab, clearScrollTo, filters, navigateToItem, scrollToId, setActiveTab, setFilter } =
        useShamelaFilters();
    const hasData = pagesCount > 0 || titlesCount > 0;

    useEffect(() => {
        hydrateSettings();
        loadFromOPFS('shamela').then((data) => {
            if (data) {
                record('RestoreShamelaFromSession');
                setBookId((data as ShamelaBook).id);
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

    const onShamelaLoaded = useCallback(
        (book: ShamelaBook, fileName?: string) => {
            setBookId(book.id);
            init(book, fileName || `shamela-${book.id}.json`);
        },
        [init, setBookId],
    );

    const parseShamelaUrl = useCallback((url: string) => {
        if (/^\d+$/.test(url)) {
            return url;
        }
        const match = url.match(/shamela\.ws\/book\/(\d+)/);
        return match ? match[1] : undefined;
    }, []);

    return (
        <DataGate
            dropZone={
                <div className="flex flex-col gap-6">
                    <DatasetLoader<ShamelaBook>
                        datasetKey="shamelaDataset"
                        description="Download from Shamela URL"
                        onDataLoaded={onShamelaLoaded}
                        parseInput={parseShamelaUrl}
                        placeholder="Paste shamela.ws URL (e.g. https://shamela.ws/book/1681)"
                        recordEventName="DownloadShamelaBook"
                        urlParam="book"
                    />
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
                                Version: {version}
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
