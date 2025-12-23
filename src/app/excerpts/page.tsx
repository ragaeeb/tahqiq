'use client';

import { DownloadIcon, FileTextIcon, Merge, RefreshCwIcon, SaveIcon, TypeIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Rule } from 'trie-rules';
import { buildTrie, searchAndReplace } from 'trie-rules';

import '@/lib/analytics';
import '@/stores/dev';

import { ConfirmButton } from '@/components/confirm-button';
import { DataGate } from '@/components/data-gate';
import JsonDropZone from '@/components/json-drop-zone';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { downloadFile } from '@/lib/domUtils';
import { clearStorage, loadFromOPFS, saveToOPFS } from '@/lib/io';
import {
    selectAllExcerpts,
    selectAllFootnotes,
    selectAllHeadings,
    selectExcerptCount,
    selectFootnoteCount,
    selectHeadingCount,
} from '@/stores/excerptsStore/selectors';
import type { Excerpts } from '@/stores/excerptsStore/types';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import ExcerptRow from './excerpt-row';
import FootnoteRow from './footnote-row';
import HeadingRow from './heading-row';
import ExcerptsTableHeader from './table-header';
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

    const { activeTab, clearScrollTo, filters, scrollToFrom, scrollToId, setActiveTab, setFilter } =
        useExcerptFilters();

    const [isFormattingLoading, setIsFormattingLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const hasData = excerptsCount > 0 || headingsCount > 0 || footnotesCount > 0;

    // Check if any excerpts have translations - if not, hide the column for more Arabic space
    const hasAnyTranslations = allExcerpts.some((e) => e.text);

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

    // Check if selected IDs are adjacent (2+ and consecutive in excerpts array)
    const canMerge = useMemo(() => {
        if (selectedIds.size < 2) {
            return false;
        }

        // Get indices of selected excerpts
        const indices: number[] = [];
        for (let i = 0; i < excerpts.length; i++) {
            if (selectedIds.has(excerpts[i].id)) {
                indices.push(i);
            }
        }

        if (indices.length < 2) {
            return false;
        }

        // Check if consecutive
        indices.sort((a, b) => a - b);
        for (let i = 1; i < indices.length; i++) {
            if (indices[i] !== indices[i - 1] + 1) {
                return false;
            }
        }
        return true;
    }, [selectedIds, excerpts]);

    // Handle merge of selected excerpts
    const handleMerge = useCallback(() => {
        if (!canMerge) {
            return;
        }

        // Get IDs in order
        const idsInOrder: string[] = [];
        for (const excerpt of excerpts) {
            if (selectedIds.has(excerpt.id)) {
                idsInOrder.push(excerpt.id);
            }
        }

        const success = mergeExcerpts(idsInOrder);
        if (success) {
            toast.success(`Merged ${idsInOrder.length} excerpts`);
            setSelectedIds(new Set());
        } else {
            toast.error('Failed to merge excerpts');
        }
    }, [canMerge, excerpts, selectedIds, mergeExcerpts]);

    useEffect(() => {
        loadFromOPFS('excerpts').then((data) => {
            if (data) {
                record('RestoreExcerptsFromSession');
                init(data as Excerpts);
            }
        });
    }, [init]);

    const handleSave = useCallback(() => {
        record('SaveExcerpts');
        const state = useExcerptsStore.getState();
        const data: Excerpts = {
            collection: state.collection,
            contractVersion: state.contractVersion,
            createdAt: Math.floor(state.createdAt.getTime() / 1000),
            excerpts: state.excerpts,
            footnotes: state.footnotes,
            headings: state.headings,
            lastUpdatedAt: Math.floor(state.lastUpdatedAt.getTime() / 1000),
            options: state.options,
            promptForTranslation: state.promptForTranslation,
        };

        try {
            saveToOPFS('excerpts', data);
            toast.success('Saved state');
        } catch (err) {
            console.error('Could not save excerpts', err);
            downloadFile(`excerpts-${Date.now()}.json`, JSON.stringify(data, null, 2));
        }
    }, []);

    const handleDownload = useCallback(() => {
        const name = prompt('Enter output file name');

        if (name) {
            record('DownloadExcerpts', name);
            const state = useExcerptsStore.getState();
            const data: Excerpts = {
                collection: state.collection,
                contractVersion: state.contractVersion,
                createdAt: Math.floor(state.createdAt.getTime() / 1000),
                excerpts: state.excerpts,
                footnotes: state.footnotes,
                headings: state.headings,
                lastUpdatedAt: Math.floor(state.lastUpdatedAt.getTime() / 1000),
                options: state.options,
                promptForTranslation: state.promptForTranslation,
            };

            downloadFile(name.endsWith('.json') ? name : `${name}.json`, JSON.stringify(data, null, 2));
        }
    }, []);

    const handleExportToTxt = useCallback(() => {
        const name = prompt('Enter output file name', 'prompt.txt');

        if (name) {
            record('DownloadExcerpts', name);

            try {
                const state = useExcerptsStore.getState();
                const excerpts = state.excerpts
                    .filter((e) => !e.text)
                    .map((e) => `${e.id} - ${e.nass}`)
                    .concat(['\n']);
                const headings = state.headings.filter((e) => !e.text).map((e) => `${e.id} - ${e.nass}`);

                const content = [state.promptForTranslation, excerpts.join('\n\n'), headings.join('\n')].join('\n\n\n');

                downloadFile(name.endsWith('.txt') ? name : `${name}.txt`, content);
            } catch (err) {
                console.error('Export failed:', err);
                toast.error('Failed to export to TXT');
            }
        }
    }, []);

    const handleReset = useCallback(() => {
        record('ResetExcerpts');
        clearStorage('excerpts');
        reset();
        setActiveTab('excerpts');
    }, [reset, setActiveTab]);

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
                            <Button onClick={handleExportToTxt}>
                                <FileTextIcon />
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
                                <TabsTrigger value="footnotes">
                                    Footnotes
                                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 text-xs">
                                        {footnotesCount}
                                    </span>
                                </TabsTrigger>

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
                                    data={excerpts}
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
                                        />
                                    }
                                    onScrollToComplete={clearScrollTo}
                                    renderRow={(item) => (
                                        <ExcerptRow
                                            data={item}
                                            hideTranslation={!hasAnyTranslations}
                                            isSelected={selectedIds.has(item.id)}
                                            onCreateFromSelection={createExcerptFromExisting}
                                            onDelete={(id) => deleteExcerpts([id])}
                                            onToggleSelect={toggleSelection}
                                            onUpdate={updateExcerpt}
                                        />
                                    )}
                                    scrollToId={scrollToId ?? scrollToFrom}
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
