'use client';

import {
    DownloadIcon,
    LanguagesIcon,
    Merge,
    PackageIcon,
    SaveIcon,
    SearchIcon,
    SettingsIcon,
    TypeIcon,
} from 'lucide-react';
import { record } from 'nanolytics';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Rule } from 'trie-rules';
import { buildTrie, searchAndReplace } from 'trie-rules';
import packageJson from '@/../package.json';

import '@/lib/analytics';
import '@/stores/dev';
import { DataGate } from '@/components/data-gate';
import { DatasetLoader } from '@/components/dataset-loader';
import { useSessionRestore } from '@/components/hooks/use-session-restore';
import { useStorageActions } from '@/components/hooks/use-storage-actions';
import JsonDropZone from '@/components/json-drop-zone';
import { ResetButton } from '@/components/reset-button';
import { Button } from '@/components/ui/button';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { compressOnClient } from '@/lib/compression.client';
import { STORAGE_KEYS } from '@/lib/constants';
import { getNeighbors } from '@/lib/grouping';
import { uploadToHuggingFace } from '@/lib/network';
import { canMergeSegments, findExcerptIssues } from '@/lib/segmentation';
import { nowInSeconds } from '@/lib/time';
import {
    selectAllExcerpts,
    selectAllFootnotes,
    selectAllHeadings,
    selectExcerptCount,
    selectFootnoteCount,
    selectHeadingCount,
} from '@/stores/excerptsStore/selectors';
import type { Compilation, Excerpt } from '@/stores/excerptsStore/types';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import { useSettingsStore } from '@/stores/settingsStore/useSettingsStore';
import ExcerptRow from './excerpt-row';
import FootnoteRow from './footnote-row';
import HeadingRow from './heading-row';
import { SegmentationOptionsContent } from './options-dialog';
import ExcerptsTableHeader from './table-header';
import { TranslationDialogContent } from './translation-dialog';
import { useExcerptFilters } from './use-excerpt-filters';
import VirtualizedList from './virtualized-list';

/**
 * Inner component that uses useSearchParams (requires Suspense boundary)
 */
function ExcerptsPageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const init = useExcerptsStore((state) => state.init);
    const reset = useExcerptsStore((state) => state.reset);
    const excerpts = useExcerptsStore(selectAllExcerpts);
    const headings = useExcerptsStore(selectAllHeadings);
    const footnotes = useExcerptsStore(selectAllFootnotes);
    const allExcerpts = useExcerptsStore((state) => state.excerpts);
    const allHeadings = useExcerptsStore((state) => state.headings);
    const allFootnotes = useExcerptsStore((state) => state.footnotes);
    const excerptsCount = useExcerptsStore(selectExcerptCount);
    const headingsCount = useExcerptsStore(selectHeadingCount);
    const footnotesCount = useExcerptsStore(selectFootnoteCount);
    const updateExcerpt = useExcerptsStore((state) => state.updateExcerpt);
    const updateHeading = useExcerptsStore((state) => state.updateHeading);
    const updateFootnote = useExcerptsStore((state) => state.updateFootnote);
    const deleteExcerpts = useExcerptsStore((state) => state.deleteExcerpts);
    const deleteHeadings = useExcerptsStore((state) => state.deleteHeadings);
    const deleteFootnotes = useExcerptsStore((state) => state.deleteFootnotes);
    const createExcerptFromExisting = useExcerptsStore((state) => state.createExcerptFromExisting);
    const applyTranslationFormatting = useExcerptsStore((state) => state.applyTranslationFormatting);
    const applyHeadingFormatting = useExcerptsStore((state) => state.applyHeadingFormatting);
    const applyFootnoteFormatting = useExcerptsStore((state) => state.applyFootnoteFormatting);
    const mergeExcerpts = useExcerptsStore((state) => state.mergeExcerpts);
    const filterExcerptsByIds = useExcerptsStore((state) => state.filterExcerptsByIds);

    const huggingfaceToken = useSettingsStore((state) => state.huggingfaceToken);
    const huggingfaceExcerptDataset = useSettingsStore((state) => state.excerptsDataset);
    const hydrateSettings = useSettingsStore((state) => state.hydrate);
    const collectionId = useExcerptsStore((state) => state.collection?.id);

    const {
        activeTab,
        clearScrollTo,
        filters,
        scrollToFrom,
        scrollToId,
        setActiveTab,
        setFilter,
        setSort,
        sortMode,
        addIdsToFilter,
    } = useExcerptFilters();

    const isAnyFilterActive = useMemo(() => {
        return !!(filters.nass || filters.text || filters.page || (filters.ids && filters.ids.length > 0));
    }, [filters]);

    const [isFormattingLoading, setIsFormattingLoading] = useState(false);
    const [isUploadingToHf, setIsUploadingToHf] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    // Track an ID to scroll to after operations like merge
    const [scrollToAfterChange, setScrollToAfterChange] = useState<string | null>(null);
    const hasData = excerptsCount > 0 || headingsCount > 0 || footnotesCount > 0;

    // Check if any excerpts have translations - if not, hide the column for more Arabic space
    const hasAnyTranslations = allExcerpts.some((e) => e.text);

    useEffect(() => {
        hydrateSettings();
    }, [hydrateSettings]);

    // Sort excerpts by length if sortMode is 'length'
    const sortedExcerpts = useMemo(() => {
        if (sortMode !== 'length') {
            return excerpts;
        }
        return [...excerpts].sort((a, b) => (b.nass?.length || 0) - (a.nass?.length || 0));
    }, [excerpts, sortMode]);

    // Compute original neighbor maps for navigation in filtered state
    const neighborMaps = useMemo(() => {
        return {
            excerpts: getNeighbors(allExcerpts),
            footnotes: getNeighbors(allFootnotes),
            headings: getNeighbors(allHeadings),
        };
    }, [allExcerpts, allHeadings, allFootnotes]);

    // Current set of visible IDs to avoid showing neighbors already in view
    const visibleIds = useMemo(() => {
        if (activeTab === 'excerpts') {
            return new Set(excerpts.map((e) => e.id));
        }
        if (activeTab === 'headings') {
            return new Set(headings.map((h) => h.id));
        }
        return new Set(footnotes.map((f) => f.id));
    }, [activeTab, excerpts, headings, footnotes]);

    const handleCopyDown = useCallback(
        (source: Excerpt) => {
            const index = sortedExcerpts.findIndex((e) => e.id === source.id);
            if (index !== -1 && index < sortedExcerpts.length - 1) {
                const nextExcerpt = sortedExcerpts[index + 1];
                updateExcerpt(nextExcerpt.id, {
                    lastUpdatedAt: source.lastUpdatedAt,
                    text: source.text,
                    translator: source.translator,
                });
                toast.success(`Copied translation to ${nextExcerpt.id}`);
            } else {
                toast.warning('No row below to copy to');
            }
        },
        [sortedExcerpts, updateExcerpt],
    );

    // Toggle selection for an excerpt
    const toggleSelection = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const canMerge = useMemo(() => {
        return canMergeSegments(selectedIds, excerpts);
    }, [selectedIds, excerpts]);

    // Handle merge of selected excerpts
    const handleMerge = useCallback(() => {
        // Get IDs in order
        const idsInOrder: string[] = [];
        for (const excerpt of excerpts) {
            if (selectedIds.has(excerpt.id)) {
                idsInOrder.push(excerpt.id);
            }
        }

        const survivingId = idsInOrder[0]; // First ID survives the merge
        const success = mergeExcerpts(idsInOrder);

        if (success) {
            toast.success(`Merged ${idsInOrder.length} excerpts`);
            setSelectedIds(new Set());

            // Set scroll target to the surviving excerpt
            setScrollToAfterChange(survivingId);

            // Clear hash if it points to a deleted excerpt
            const hash = window.location.hash.slice(1);
            if (hash && idsInOrder.slice(1).some((id) => id === hash || id.includes(hash))) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                clearScrollTo();
            }
        } else {
            toast.error('Failed to merge excerpts');
        }
    }, [excerpts, selectedIds, mergeExcerpts, clearScrollTo]);

    // Clear the scroll-after-change state once complete
    const handleScrollAfterChangeComplete = useCallback(() => {
        setScrollToAfterChange(null);
    }, []);

    // Callback for DatasetLoader
    const onExcerptsLoaded = useCallback(
        (data: Compilation, fileName?: string) => {
            // Extract book ID from fileName (e.g., "1234.json" -> "1234")
            // and set it as collection.id for HuggingFace upload default
            if (fileName) {
                const bookId = fileName.replace(/\.json$/, '');
                data.collection = { ...data.collection, id: bookId, title: data.collection?.title || '' };
            }
            init(data, fileName);
        },
        [init],
    );

    // Session restore hook
    useSessionRestore<Compilation>(STORAGE_KEYS.excerpts, init, 'RestoreExcerptsFromSession');

    // Storage actions hook
    const getExportData = useCallback((): Compilation => {
        const state = useExcerptsStore.getState();
        return {
            collection: state.collection,
            contractVersion: state.contractVersion,
            createdAt: state.createdAt,
            excerpts: state.excerpts,
            footnotes: state.footnotes,
            headings: state.headings,
            lastUpdatedAt: nowInSeconds(),
            options: state.options,
            postProcessingApps: state.postProcessingApps.concat({
                id: packageJson.name,
                timestamp: nowInSeconds(),
                version: packageJson.version,
            }),
            promptForTranslation: state.promptForTranslation,
        };
    }, []);

    const handleResetWithTabClear = useCallback(() => {
        reset();
        setActiveTab('excerpts');
    }, [reset, setActiveTab]);

    const { handleSave, handleDownload, handleReset, handleResetAll } = useStorageActions({
        analytics: { download: 'DownloadExcerpts', reset: 'ResetExcerpts', save: 'SaveExcerpts' },
        defaultOutputName: 'excerpts.json',
        getExportData,
        reset: handleResetWithTabClear,
        storageKey: STORAGE_KEYS.excerpts,
    });

    // Find all issues: gaps (missing translations) and truncated translations
    const handleFindGap = useCallback(() => {
        const issueIds = findExcerptIssues(allExcerpts);

        if (issueIds.length > 0) {
            const params = new URLSearchParams(searchParams.toString());
            // Clear previous filters to show only the issues
            params.delete('nass');
            params.delete('text');
            params.delete('page');
            params.set('tab', 'excerpts');
            params.set('ids', issueIds.join(','));

            router.replace(`${pathname}?${params.toString()}`, { scroll: false });

            toast.info(
                `Found ${issueIds.length} issue${issueIds.length > 1 ? 's' : ''} (gaps + truncated translations)`,
            );
        } else {
            toast.info('No issues found');
        }
    }, [allExcerpts, router, pathname, searchParams]);

    const handleApplyFormatting = useCallback(async () => {
        setIsFormattingLoading(true);
        try {
            record('ApplyALALCFormatting', activeTab);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            // Download rules from API
            const response = await fetch('/api/rules', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error('Failed to fetch formatting rules');
            }

            const { rules } = (await response.json()) as { rules: Rule[] };

            // Build trie from rules
            const trie = buildTrie(rules);

            // Create the formatting function
            const formatFn = (text: string) => searchAndReplace(trie, text);

            // Apply formatting based on active tab
            if (activeTab === 'excerpts') {
                applyTranslationFormatting(formatFn);
                toast.success(`Formatted ${excerptsCount} excerpt translations`);
            } else if (activeTab === 'headings') {
                applyHeadingFormatting(formatFn);
                toast.success(`Formatted ${headingsCount} heading translations`);
            } else if (activeTab === 'footnotes') {
                applyFootnoteFormatting(formatFn);
                toast.success(`Formatted ${footnotesCount} footnote translations`);
            }
        } catch (error) {
            console.error('Formatting error:', error);
            toast.error('Failed to apply formatting');
        } finally {
            setIsFormattingLoading(false);
        }
    }, [
        activeTab,
        applyTranslationFormatting,
        applyHeadingFormatting,
        applyFootnoteFormatting,
        excerptsCount,
        headingsCount,
        footnotesCount,
    ]);

    const handleUploadToHuggingFace = useCallback(async () => {
        const defaultFilename = collectionId || '';
        const filename =
            prompt('Enter filename for compressed upload (without extension, ie: 1234):', defaultFilename) || '';

        if (!/^\d+$/.test(filename)) {
            return; // User cancelled
        }

        const toastId = toast.loading('Compressing excerpts...');

        setIsUploadingToHf(true);
        record('UploadToHuggingFace');

        try {
            const { blob: fileBlob } = await compressOnClient(getExportData());

            toast.loading('Uploading to HuggingFace...', { id: toastId });

            const result = await uploadToHuggingFace({
                fileBlob,
                pathInRepo: `${filename}.json.br`,
                repoId: huggingfaceExcerptDataset,
                token: huggingfaceToken,
            });

            toast.success(`Uploaded to HuggingFace! ${result}`, { id: toastId });
        } catch (error) {
            console.error('HuggingFace upload error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to upload to HuggingFace', { id: toastId });
        } finally {
            setIsUploadingToHf(false);
        }
    }, [collectionId, huggingfaceToken, huggingfaceExcerptDataset, getExportData]);

    return (
        <DataGate
            dropZone={
                <div className="flex flex-col gap-6">
                    <DatasetLoader<Compilation>
                        datasetKey="excerptsDataset"
                        description="Download from Excerpts Dataset"
                        onDataLoaded={onExcerptsLoaded}
                        placeholder="Enter Book ID (e.g. 1234)"
                        recordEventName="DownloadExcerptsBook"
                        urlParam="book"
                    />
                    <JsonDropZone
                        description="Drag and drop an Excerpts JSON file"
                        maxFiles={1}
                        onFiles={(fileNameToData) => {
                            const keys = Object.keys(fileNameToData);
                            const data = fileNameToData[keys[0]];

                            // Validate basic structure before casting
                            if (
                                data &&
                                typeof data === 'object' &&
                                'excerpts' in data &&
                                'headings' in data &&
                                'footnotes' in data
                            ) {
                                record('LoadExcerpts', keys[0]);
                                init(data as unknown as Compilation, keys[0]);
                            } else {
                                toast.error('Invalid Excerpts file format');
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
                        <h1 className="font-bold text-gray-800 text-xl">Excerpts Editor</h1>
                        <div className="space-x-2">
                            <Button className="bg-emerald-500" onClick={handleSave}>
                                <SaveIcon />
                            </Button>
                            <Button onClick={handleDownload}>
                                <DownloadIcon />
                            </Button>
                            {huggingfaceToken && huggingfaceExcerptDataset && (
                                <Button
                                    className="bg-purple-500 hover:bg-purple-600"
                                    disabled={isUploadingToHf}
                                    onClick={handleUploadToHuggingFace}
                                    title="Upload compressed excerpts to HuggingFace dataset"
                                >
                                    <PackageIcon />
                                </Button>
                            )}
                            <DialogTriggerButton
                                onClick={() => {
                                    record('OpenTranslationPicker');
                                }}
                                renderContent={() => <TranslationDialogContent />}
                                title="Select excerpts for LLM translation"
                                className="bg-indigo-500 hover:bg-indigo-600"
                            >
                                <LanguagesIcon />
                            </DialogTriggerButton>
                            <Button className="bg-amber-500" onClick={handleFindGap} title="Find first translation gap">
                                <SearchIcon />
                            </Button>
                            <Button
                                className="bg-blue-500"
                                disabled={isFormattingLoading}
                                onClick={handleApplyFormatting}
                                title="Apply ALA-LC transliteration formatting"
                            >
                                <TypeIcon />
                            </Button>
                            <DialogTriggerButton
                                className="bg-gray-500 hover:bg-gray-600"
                                renderContent={() => {
                                    const options = useExcerptsStore.getState().options;
                                    return <SegmentationOptionsContent options={options} />;
                                }}
                                title="Show original segmentation options"
                            >
                                <SettingsIcon />
                            </DialogTriggerButton>
                            <ResetButton onReset={handleReset} onResetAll={handleResetAll} />
                        </div>
                    </div>

                    <div className="w-full">
                        <Tabs className="w-full" onValueChange={setActiveTab as any} value={activeTab}>
                            <TabsList className="w-full justify-start rounded-none border-gray-200 border-b bg-white">
                                <TabsTrigger value="excerpts">
                                    Excerpts
                                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 text-xs">
                                        {excerptsCount}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger value="headings">
                                    Headings
                                    <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-purple-700 text-xs">
                                        {headingsCount}
                                    </span>
                                </TabsTrigger>
                                {footnotesCount ? (
                                    <TabsTrigger value="footnotes">
                                        Footnotes
                                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 text-xs">
                                            {footnotesCount}
                                        </span>
                                    </TabsTrigger>
                                ) : null}

                                {/* Translation Progress */}
                                {(() => {
                                    const items =
                                        activeTab === 'excerpts'
                                            ? allExcerpts
                                            : activeTab === 'headings'
                                              ? allHeadings
                                              : allFootnotes;
                                    const total = items.length;
                                    const translated = items.filter((item) => item.text?.trim()).length;
                                    const remaining = total - translated;
                                    const percentage = total > 0 ? Math.round((translated / total) * 100) : 0;

                                    return (
                                        <div className="ml-auto flex items-center gap-3 pr-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                                                    <div
                                                        className="h-full bg-green-500 transition-all duration-300"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-gray-600 text-xs">
                                                    {translated}/{total} ({percentage}%)
                                                </span>
                                            </div>
                                            <span className="text-gray-400 text-xs">{remaining} remaining</span>
                                        </div>
                                    );
                                })()}
                            </TabsList>

                            <TabsContent className="mt-0" value="excerpts">
                                {canMerge && (
                                    <div className="mb-2 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2">
                                        <span className="text-blue-700 text-sm">
                                            {selectedIds.size} adjacent excerpts selected
                                        </span>
                                        <Button onClick={handleMerge} size="sm" variant="default">
                                            <Merge className="mr-1 h-4 w-4" />
                                            Merge
                                        </Button>
                                        <Button onClick={() => setSelectedIds(new Set())} size="sm" variant="outline">
                                            Clear Selection
                                        </Button>
                                    </div>
                                )}
                                <VirtualizedList
                                    data={sortedExcerpts}
                                    findScrollIndex={(data, scrollValue) => {
                                        // If it's a number, search by from field
                                        if (typeof scrollValue === 'number') {
                                            return data.findIndex((item) => item.from === scrollValue);
                                        }
                                        // If it's a string, search by id field (e.g., P233)
                                        return data.findIndex((item) => item.id === scrollValue);
                                    }}
                                    getKey={(item) => (item ? `${item.id}/${item.lastUpdatedAt}` : 'loading')}
                                    header={
                                        <ExcerptsTableHeader
                                            activeTab="excerpts"
                                            excerpts={allExcerpts}
                                            filters={filters}
                                            footnotes={allFootnotes}
                                            headings={allHeadings}
                                            hideTranslation={!hasAnyTranslations}
                                            onFilterChange={setFilter}
                                            onSortChange={setSort}
                                            sortMode={sortMode}
                                        />
                                    }
                                    onScrollToComplete={
                                        scrollToAfterChange ? handleScrollAfterChangeComplete : clearScrollTo
                                    }
                                    renderRow={(item) => {
                                        if (!item) {
                                            return null;
                                        }
                                        const neighbors = neighborMaps.excerpts[item.id];
                                        const prevId =
                                            neighbors?.prev && !visibleIds.has(neighbors.prev)
                                                ? neighbors.prev
                                                : undefined;
                                        const nextId =
                                            neighbors?.next && !visibleIds.has(neighbors.next)
                                                ? neighbors.next
                                                : undefined;

                                        return (
                                            <ExcerptRow
                                                data={item}
                                                hideTranslation={!hasAnyTranslations}
                                                isFiltered={isAnyFilterActive}
                                                isSelected={selectedIds.has(item.id)}
                                                onCreateFromSelection={createExcerptFromExisting}
                                                onDelete={(id) => deleteExcerpts([id])}
                                                onToggleSelect={toggleSelection}
                                                onUpdate={updateExcerpt}
                                                onCopyDown={handleCopyDown}
                                                onShowInContext={(id) => {
                                                    filterExcerptsByIds(undefined);
                                                    setScrollToAfterChange(id);
                                                }}
                                                prevId={prevId}
                                                nextId={nextId}
                                                onAddNeighbor={(id) => addIdsToFilter([id])}
                                            />
                                        );
                                    }}
                                    scrollToId={scrollToAfterChange ?? scrollToId ?? scrollToFrom}
                                />
                            </TabsContent>

                            <TabsContent className="mt-0" value="headings">
                                <VirtualizedList
                                    data={headings}
                                    findScrollIndex={(data, idValue) => data.findIndex((item) => item.id === idValue)}
                                    getKey={(item) => (item ? item.id : 'loading')}
                                    header={
                                        <ExcerptsTableHeader
                                            activeTab="headings"
                                            excerpts={allExcerpts}
                                            filters={filters}
                                            footnotes={allFootnotes}
                                            headings={allHeadings}
                                            onFilterChange={setFilter}
                                        />
                                    }
                                    onScrollToComplete={clearScrollTo}
                                    renderRow={(item) => {
                                        if (!item) {
                                            return null;
                                        }
                                        const neighbors = neighborMaps.headings[item.id];
                                        const prevId =
                                            neighbors?.prev && !visibleIds.has(neighbors.prev)
                                                ? neighbors.prev
                                                : undefined;
                                        const nextId =
                                            neighbors?.next && !visibleIds.has(neighbors.next)
                                                ? neighbors.next
                                                : undefined;

                                        return (
                                            <HeadingRow
                                                data={item}
                                                onDelete={(id) => deleteHeadings([id])}
                                                onUpdate={updateHeading}
                                                prevId={prevId}
                                                nextId={nextId}
                                                onAddNeighbor={(id) => addIdsToFilter([id])}
                                                isFiltered={isAnyFilterActive}
                                            />
                                        );
                                    }}
                                    scrollToId={scrollToId}
                                />
                            </TabsContent>

                            <TabsContent className="mt-0" value="footnotes">
                                <VirtualizedList
                                    data={footnotes}
                                    getKey={(item) => (item ? item.id : 'loading')}
                                    header={
                                        <ExcerptsTableHeader
                                            activeTab="footnotes"
                                            excerpts={allExcerpts}
                                            filters={filters}
                                            footnotes={allFootnotes}
                                            headings={allHeadings}
                                            onFilterChange={setFilter}
                                        />
                                    }
                                    renderRow={(item) => {
                                        if (!item) {
                                            return null;
                                        }
                                        const neighbors = neighborMaps.footnotes[item.id];
                                        const prevId =
                                            neighbors?.prev && !visibleIds.has(neighbors.prev)
                                                ? neighbors.prev
                                                : undefined;
                                        const nextId =
                                            neighbors?.next && !visibleIds.has(neighbors.next)
                                                ? neighbors.next
                                                : undefined;

                                        return (
                                            <FootnoteRow
                                                data={item}
                                                onDelete={(id) => deleteFootnotes([id])}
                                                onUpdate={updateFootnote}
                                                prevId={prevId}
                                                nextId={nextId}
                                                onAddNeighbor={(id) => addIdsToFilter([id])}
                                                isFiltered={isAnyFilterActive}
                                            />
                                        );
                                    }}
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
 * Excerpts editor page with virtualized lists for large datasets
 */
export default function ExcerptsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <ExcerptsPageContent />
        </Suspense>
    );
}
