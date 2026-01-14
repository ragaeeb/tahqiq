'use client';

import { DownloadIcon, LanguagesIcon, Merge, RefreshCwIcon, SaveIcon, SearchIcon, TypeIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Rule } from 'trie-rules';
import { buildTrie, searchAndReplace } from 'trie-rules';
import packageJson from '@/../package.json';

import '@/lib/analytics';
import '@/stores/dev';
import { ConfirmButton } from '@/components/confirm-button';
import { DataGate } from '@/components/data-gate';
import { useSessionRestore } from '@/components/hooks/use-session-restore';
import { useStorageActions } from '@/components/hooks/use-storage-actions';
import JsonDropZone from '@/components/json-drop-zone';
import { Button } from '@/components/ui/button';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { STORAGE_KEYS } from '@/lib/constants';
import { canMergeSegments } from '@/lib/segmentation';
import { nowInSeconds } from '@/lib/time';
import { findExcerptIssues } from '@/lib/validation';
import {
    selectAllExcerpts,
    selectAllFootnotes,
    selectAllHeadings,
    selectExcerptCount,
    selectFootnoteCount,
    selectHeadingCount,
} from '@/stores/excerptsStore/selectors';
import type { Excerpt, Excerpts } from '@/stores/excerptsStore/types';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import ExcerptRow from './excerpt-row';
import FootnoteRow from './footnote-row';
import HeadingRow from './heading-row';
import ExcerptsTableHeader from './table-header';
import { TranslationDialogContent } from './translation-dialog';
import type { FilterScope } from './use-excerpt-filters';
import { useExcerptFilters } from './use-excerpt-filters';
import VirtualizedList from './virtualized-list';

/**
 * Inner component that uses useSearchParams (requires Suspense boundary)
 */
function ExcerptsPageContent() {
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

    const { activeTab, clearScrollTo, filters, scrollToFrom, scrollToId, setActiveTab, setFilter, setSort, sortMode } =
        useExcerptFilters();

    const [isFormattingLoading, setIsFormattingLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    // Track an ID to scroll to after operations like merge
    const [scrollToAfterChange, setScrollToAfterChange] = useState<string | null>(null);
    const hasData = excerptsCount > 0 || headingsCount > 0 || footnotesCount > 0;

    // Check if any excerpts have translations - if not, hide the column for more Arabic space
    const hasAnyTranslations = allExcerpts.some((e) => e.text);

    // Sort excerpts by length if sortMode is 'length'
    const sortedExcerpts = useMemo(() => {
        if (sortMode !== 'length') {
            return excerpts;
        }
        return [...excerpts].sort((a, b) => (b.nass?.length || 0) - (a.nass?.length || 0));
    }, [excerpts, sortMode]);

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
        console.log('[handleMerge] Starting merge, selectedIds:', Array.from(selectedIds));

        // Get IDs in order
        const idsInOrder: string[] = [];
        for (const excerpt of excerpts) {
            if (selectedIds.has(excerpt.id)) {
                idsInOrder.push(excerpt.id);
            }
        }

        console.log('[handleMerge] IDs to merge in order:', idsInOrder);
        const survivingId = idsInOrder[0]; // First ID survives the merge
        const success = mergeExcerpts(idsInOrder);
        console.log('[handleMerge] Merge result:', success);

        if (success) {
            toast.success(`Merged ${idsInOrder.length} excerpts`);
            setSelectedIds(new Set());

            // Set scroll target to the surviving excerpt
            console.log('[handleMerge] Setting scrollToAfterChange to:', survivingId);
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
        console.log('[page] scrollToAfterChange complete, clearing');
        setScrollToAfterChange(null);
    }, []);

    // Session restore hook
    useSessionRestore<Excerpts>(STORAGE_KEYS.excerpts, init, 'RestoreExcerptsFromSession');

    // Storage actions hook
    const getExportData = useCallback((): Excerpts => {
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

    const { handleSave, handleDownload, handleReset } = useStorageActions({
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
            filterExcerptsByIds(issueIds);
            toast.info(
                `Found ${issueIds.length} issue${issueIds.length > 1 ? 's' : ''} (gaps + truncated translations)`,
            );
        } else {
            toast.info('No issues found');
        }
    }, [allExcerpts, filterExcerptsByIds]);

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

    const handleTabChange = useCallback(
        (tab: string) => {
            setActiveTab(tab as FilterScope);
        },
        [setActiveTab],
    );

    return (
        <DataGate
            dropZone={
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
                            init(data as unknown as Excerpts, keys[0]);
                        } else {
                            toast.error('Invalid Excerpts file format');
                        }
                    }}
                />
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
                            <ConfirmButton onClick={handleReset}>
                                <RefreshCwIcon />
                            </ConfirmButton>
                        </div>
                    </div>

                    <div className="w-full">
                        <Tabs className="w-full" onValueChange={handleTabChange} value={activeTab}>
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
                                    getKey={(item) => `${item.id}/${item.lastUpdatedAt}`}
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
                                    renderRow={(item) => (
                                        <ExcerptRow
                                            data={item}
                                            hideTranslation={!hasAnyTranslations}
                                            isSelected={selectedIds.has(item.id)}
                                            onCreateFromSelection={createExcerptFromExisting}
                                            onDelete={(id) => deleteExcerpts([id])}
                                            onToggleSelect={toggleSelection}
                                            onUpdate={updateExcerpt}
                                            onCopyDown={handleCopyDown}
                                        />
                                    )}
                                    scrollToId={scrollToAfterChange ?? scrollToId ?? scrollToFrom}
                                />
                            </TabsContent>

                            <TabsContent className="mt-0" value="headings">
                                <VirtualizedList
                                    data={headings}
                                    findScrollIndex={(data, idValue) => data.findIndex((item) => item.id === idValue)}
                                    getKey={(item) => item.id}
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
                                    renderRow={(item) => (
                                        <HeadingRow
                                            data={item}
                                            onDelete={(id) => deleteHeadings([id])}
                                            onUpdate={updateHeading}
                                        />
                                    )}
                                    scrollToId={scrollToId}
                                />
                            </TabsContent>

                            <TabsContent className="mt-0" value="footnotes">
                                <VirtualizedList
                                    data={footnotes}
                                    getKey={(item) => item.id}
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
                                    renderRow={(item) => (
                                        <FootnoteRow
                                            data={item}
                                            onDelete={(id) => deleteFootnotes([id])}
                                            onUpdate={updateFootnote}
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
 * Excerpts editor page with virtualized lists for large datasets
 */
export default function ExcerptsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <ExcerptsPageContent />
        </Suspense>
    );
}
