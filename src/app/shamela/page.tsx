'use client';

import { DownloadIcon, RefreshCwIcon, SaveIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { Suspense, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import '@/lib/analytics';

import { ConfirmButton } from '@/components/confirm-button';
import { DataGate } from '@/components/data-gate';
import JsonDropZone from '@/components/json-drop-zone';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { downloadFile } from '@/lib/domUtils';
import { loadCompressed, saveCompressed } from '@/lib/io';
import { selectAllPages, selectAllTitles, selectPageCount, selectTitleCount } from '@/stores/shamelaStore/selectors';
import type { ShamelaBook } from '@/stores/shamelaStore/types';
import { useShamelaStore } from '@/stores/shamelaStore/useShamelaStore';

import VirtualizedList from '../excerpts/virtualized-list';
import PageRow from './page-row';
import ShamelaTableHeader from './table-header';
import TitleRow from './title-row';
import { useShamelaFilters } from './use-shamela-filters';

/**
 * Inner component that uses store state
 */
function ShamelaPageContent() {
    const init = useShamelaStore((state) => state.init);
    const reset = useShamelaStore((state) => state.reset);
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

    const { activeTab, filters, setActiveTab, setFilter } = useShamelaFilters();
    const hasData = pagesCount > 0 || titlesCount > 0;

    useEffect(() => {
        loadCompressed('shamela').then((data) => {
            if (data) {
                record('RestoreShamelaFromSession');
                init(data as ShamelaBook);
            }
        });
    }, [init]);

    const handleSave = useCallback(() => {
        record('SaveShamela');
        const state = useShamelaStore.getState();
        const data: ShamelaBook = {
            majorRelease: state.majorRelease,
            pages: state.pages.map((p) => ({
                content: p.content,
                id: p.id,
                number: p.number,
                page: p.page,
                part: p.part,
            })),
            shamelaId: state.shamelaId,
            titles: state.titles.map((t) => ({ content: t.content, id: t.id, page: t.page, parent: t.parent })),
        };

        try {
            saveCompressed('shamela', data);
            toast.success('Saved state');
        } catch (err) {
            console.error('Could not save shamela', err);
            downloadFile(`shamela-${Date.now()}.json`, JSON.stringify(data, null, 2));
        }
    }, []);

    const handleDownload = useCallback(() => {
        const name = prompt('Enter output file name');

        if (name) {
            record('DownloadShamela', name);
            const state = useShamelaStore.getState();
            const data: ShamelaBook = {
                majorRelease: state.majorRelease,
                pages: state.pages.map((p) => ({
                    content: p.content,
                    id: p.id,
                    number: p.number,
                    page: p.page,
                    part: p.part,
                })),
                shamelaId: state.shamelaId,
                titles: state.titles.map((t) => ({ content: t.content, id: t.id, page: t.page, parent: t.parent })),
            };

            downloadFile(name.endsWith('.json') ? name : `${name}.json`, JSON.stringify(data, null, 2));
        }
    }, []);

    const handleReset = useCallback(() => {
        record('ResetShamela');
        reset();
    }, [reset]);

    const handleTabChange = useCallback(
        (tab: string) => {
            setActiveTab(tab as 'pages' | 'titles');
        },
        [setActiveTab],
    );

    return (
        <DataGate
            dropZone={
                <JsonDropZone
                    description="Drag and drop a Shamela book JSON file"
                    maxFiles={1}
                    onFiles={(fileNameToData) => {
                        const keys = Object.keys(fileNameToData);
                        const data = fileNameToData[keys[0]];

                        // Validate basic structure before casting
                        if (data && typeof data === 'object' && 'pages' in data && 'majorRelease' in data) {
                            record('LoadShamela', keys[0]);
                            init(data as unknown as ShamelaBook, keys[0]);
                        } else {
                            toast.error('Invalid Shamela book format');
                        }
                    }}
                />
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
                        <div className="space-x-2">
                            <Button className="bg-emerald-500" onClick={handleSave}>
                                <SaveIcon />
                            </Button>
                            <Button onClick={handleDownload}>
                                <DownloadIcon />
                            </Button>
                            <ConfirmButton onClick={handleReset}>
                                <RefreshCwIcon />
                            </ConfirmButton>
                        </div>
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
                                    renderRow={(item) => (
                                        <PageRow data={item} onUpdate={updatePage} shamelaId={shamelaId} />
                                    )}
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
                                        <TitleRow data={item} onUpdate={updateTitle} shamelaId={shamelaId} />
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
