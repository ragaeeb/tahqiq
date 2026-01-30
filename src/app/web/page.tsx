'use client';

import { record } from 'nanolytics';
import { Suspense, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import '@/lib/analytics';
import { DataGate } from '@/components/data-gate';
import JsonDropZone from '@/components/json-drop-zone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadFromOPFS } from '@/lib/io';
import { selectAllPages, selectAllTitles } from '@/stores/webStore/selectors';
import type { ScrapeResult } from '@/stores/webStore/types';
import { useWebStore } from '@/stores/webStore/useWebStore';
import VirtualizedList from '../excerpts/virtualized-list';
import PageRow from './page-row';
import WebTableHeader from './table-header';
import TitleRow from './title-row';
import { Toolbar } from './toolbar';
import { useWebFilters } from './use-web-filters';

/**
 * Extract origin/domain from URL pattern for display
 */
function getOriginFromPattern(urlPattern?: string): string | null {
    if (!urlPattern) {
        return null;
    }
    try {
        // Replace {{page}} with a placeholder number to parse
        const testUrl = urlPattern.replace('{{page}}', '1');
        const url = new URL(testUrl);
        return url.origin;
    } catch {
        return null;
    }
}

/**
 * Inner component that uses store state
 */
function WebPageContent() {
    const init = useWebStore((state) => state.init);
    const pages = useWebStore(selectAllPages);
    const titles = useWebStore(selectAllTitles);
    const urlPattern = useWebStore((state) => state.urlPattern);
    const scrapingEngine = useWebStore((state) => state.scrapingEngine);

    const { activeTab, clearScrollTo, filters, navigateToItem, scrollToId, setActiveTab, setFilter } = useWebFilters();

    useEffect(() => {
        loadFromOPFS('web').then((data) => {
            if (data) {
                record('RestoreWebFromSession');
                init(data as ScrapeResult);
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

    const origin = getOriginFromPattern(urlPattern);

    return (
        <DataGate
            dropZone={
                <JsonDropZone
                    description="Drag and drop a Web content JSON file"
                    maxFiles={1}
                    onFiles={(fileNameToData) => {
                        const keys = Object.keys(fileNameToData);
                        const data = fileNameToData[keys[0]];

                        // Validate basic structure before casting
                        if (typeof data === 'object' && 'pages' in data && Array.isArray(data.pages)) {
                            record('LoadWeb', keys[0]);
                            init(data as unknown as ScrapeResult);
                        } else {
                            toast.error('Invalid Web content format. Expected pages array.');
                        }
                    }}
                />
            }
            hasData={pages.length > 0}
        >
            <div className="flex min-h-screen flex-col font-[family-name:var(--font-geist-sans)]">
                <div className="w-full">
                    <div className="sticky top-0 z-20 flex items-center justify-between border-gray-200 border-b bg-white px-4 py-3 shadow-sm">
                        <div>
                            <h1 className="font-bold text-gray-800 text-xl">Web Editor</h1>
                            <span className="text-gray-500 text-sm">
                                {origin && `Source: ${origin}`}
                                {scrapingEngine && ` • ${scrapingEngine.name} v${scrapingEngine.version}`}
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
                                        {pages.length}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger value="titles">
                                    Titles
                                    <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-purple-700 text-xs">
                                        {titles.length}
                                    </span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent className="mt-0" value="pages">
                                <VirtualizedList
                                    data={pages}
                                    getKey={(item) => item.id}
                                    header={
                                        <WebTableHeader
                                            activeTab="pages"
                                            filters={filters}
                                            onFilterChange={setFilter}
                                            pages={pages}
                                            titles={titles}
                                        />
                                    }
                                    onScrollToComplete={clearScrollTo}
                                    renderRow={(item) => <PageRow data={item} urlPattern={urlPattern} />}
                                    scrollToId={scrollToId}
                                />
                            </TabsContent>

                            <TabsContent className="mt-0" value="titles">
                                <VirtualizedList
                                    data={titles}
                                    getKey={(item) => item.id}
                                    header={
                                        <WebTableHeader
                                            activeTab="titles"
                                            filters={filters}
                                            onFilterChange={setFilter}
                                            pages={pages}
                                            titles={titles}
                                        />
                                    }
                                    renderRow={(item) => (
                                        <TitleRow data={item} onNavigateToPage={handleNavigateToPage} />
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
 * Web content editor page with virtualized lists for large datasets
 */
export default function WebPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <WebPageContent />
        </Suspense>
    );
}
