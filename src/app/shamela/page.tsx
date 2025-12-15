'use client';

import {
    DownloadIcon,
    EraserIcon,
    FileTextIcon,
    FootprintsIcon,
    RefreshCwIcon,
    SaveIcon,
    SplitIcon,
} from 'lucide-react';
import { record } from 'nanolytics';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import '@/lib/analytics';

import { ConfirmButton } from '@/components/confirm-button';
import { DataGate } from '@/components/data-gate';
import JsonDropZone from '@/components/json-drop-zone';
import SubmittableInput from '@/components/submittable-input';
import { Button } from '@/components/ui/button';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { downloadFile } from '@/lib/domUtils';
import { loadCompressed, saveCompressed } from '@/lib/io';
import { usePatchStore } from '@/stores/patchStore';
import { useSettingsStore } from '@/stores/settingsStore/useSettingsStore';
import { selectAllPages, selectAllTitles, selectPageCount, selectTitleCount } from '@/stores/shamelaStore/selectors';
import type { ShamelaBook } from '@/stores/shamelaStore/types';
import { useShamelaStore } from '@/stores/shamelaStore/useShamelaStore';
import VirtualizedList from '../excerpts/virtualized-list';
import { JsonSegmentationDialogContent } from './json-segmentation-dialog';
import PageRow from './page-row';
import { PatchesDialogContent } from './patches-dialog';
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
    const removePageMarkers = useShamelaStore((state) => state.removePageMarkers);
    const removeFootnoteReferences = useShamelaStore((state) => state.removeFootnoteReferences);

    const patchCount = usePatchStore((state) => state.patches.length);
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
        loadCompressed('shamela').then((data) => {
            if (data) {
                record('RestoreShamelaFromSession');
                setBookId((data as ShamelaBook).shamelaId);
                init(data as ShamelaBook);
            }
        });
    }, [init, hydrateSettings, setBookId]);

    /**
     * Creates a ShamelaBook object from the current store state.
     * Shared between save and download handlers to avoid duplication.
     */
    const getShamelaBookData = useCallback((): ShamelaBook => {
        const state = useShamelaStore.getState();
        return {
            majorRelease: state.majorRelease,
            pages: state.pages.map((p) => ({
                content: p.footnote ? `${p.body}_________${p.footnote}` : p.body,
                id: p.id,
                number: p.number,
                page: p.page,
                part: p.part,
            })),
            shamelaId: state.shamelaId,
            titles: state.titles.map((t) => ({ content: t.content, id: t.id, page: t.page, parent: t.parent })),
        };
    }, []);

    const handleSave = useCallback(() => {
        record('SaveShamela');
        const data = getShamelaBookData();

        try {
            saveCompressed('shamela', data);
            toast.success('Saved state');
        } catch (err) {
            console.error('Could not save shamela', err);
            downloadFile(`shamela-${Date.now()}.json`, JSON.stringify(data, null, 2));
        }
    }, [getShamelaBookData]);

    const handleDownload = useCallback(() => {
        const name = prompt('Enter output file name');

        if (name) {
            record('DownloadShamela', name);
            const data = getShamelaBookData();
            downloadFile(name.endsWith('.json') ? name : `${name}.json`, JSON.stringify(data, null, 2));
        }
    }, [getShamelaBookData]);

    const handleReset = useCallback(() => {
        record('ResetShamela');
        reset();
    }, [reset]);

    const handleRemovePageMarkers = useCallback(() => {
        record('RemovePageMarkers');
        removePageMarkers();
        toast.success('Removed Arabic page markers from all pages');
    }, [removePageMarkers]);

    const handleRemoveFootnoteReferences = useCallback(() => {
        record('RemoveFootnoteReferences');
        removeFootnoteReferences();
        toast.success('Removed footnote references and cleared footnotes from all pages');
    }, [removeFootnoteReferences]);

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
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to download book');
                }

                const book: ShamelaBook = await response.json();
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
                        <div className="space-x-2">
                            <Button onClick={handleRemovePageMarkers} title="Remove page markers" variant="outline">
                                <EraserIcon />
                            </Button>
                            <Button
                                onClick={handleRemoveFootnoteReferences}
                                title="Remove footnote references and clear footnotes"
                                variant="outline"
                            >
                                <FootprintsIcon />
                            </Button>
                            <DialogTriggerButton
                                onClick={() => record('OpenSegmentationDialog')}
                                renderContent={() => <JsonSegmentationDialogContent pages={allPages} />}
                                title="Segment pages"
                                variant="outline"
                            >
                                <SplitIcon />
                            </DialogTriggerButton>
                            <DialogTriggerButton
                                onClick={() => record('OpenPatchesDialog')}
                                renderContent={() => <PatchesDialogContent />}
                                title="View tracked patches"
                                variant="outline"
                            >
                                <FileTextIcon />
                                {patchCount > 0 && (
                                    <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-orange-700 text-xs">
                                        {patchCount}
                                    </span>
                                )}
                            </DialogTriggerButton>
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
