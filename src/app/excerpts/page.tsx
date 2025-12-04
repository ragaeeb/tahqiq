'use client';

import { DownloadIcon, RefreshCwIcon, SaveIcon, TypeIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Rule } from 'trie-rules';
import { buildTrie, searchAndReplace } from 'trie-rules';

import '@/lib/analytics';

import { ConfirmButton } from '@/components/confirm-button';
import JsonDropZone from '@/components/json-drop-zone';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VersionFooter from '@/components/version-footer';
import { downloadFile } from '@/lib/domUtils';
import { loadCompressed, saveCompressed } from '@/lib/io';
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
import VirtualizedList from './virtualized-list';

/**
 * Excerpts editor page with virtualized lists for large datasets
 */
export default function ExcerptsPage() {
    const init = useExcerptsStore((state) => state.init);
    const reset = useExcerptsStore((state) => state.reset);
    const excerpts = useExcerptsStore(selectAllExcerpts);
    const headings = useExcerptsStore(selectAllHeadings);
    const footnotes = useExcerptsStore(selectAllFootnotes);
    const excerptsCount = useExcerptsStore(selectExcerptCount);
    const headingsCount = useExcerptsStore(selectHeadingCount);
    const footnotesCount = useExcerptsStore(selectFootnoteCount);
    const updateExcerpt = useExcerptsStore((state) => state.updateExcerpt);
    const updateHeading = useExcerptsStore((state) => state.updateHeading);
    const updateFootnote = useExcerptsStore((state) => state.updateFootnote);
    const deleteExcerpts = useExcerptsStore((state) => state.deleteExcerpts);
    const deleteHeadings = useExcerptsStore((state) => state.deleteHeadings);
    const deleteFootnotes = useExcerptsStore((state) => state.deleteFootnotes);
    const applyTranslationFormatting = useExcerptsStore((state) => state.applyTranslationFormatting);
    const applyHeadingFormatting = useExcerptsStore((state) => state.applyHeadingFormatting);
    const applyFootnoteFormatting = useExcerptsStore((state) => state.applyFootnoteFormatting);

    const [activeTab, setActiveTab] = useState('excerpts');
    const [isFormattingLoading, setIsFormattingLoading] = useState(false);
    const hasData = excerptsCount > 0 || headingsCount > 0 || footnotesCount > 0;

    useEffect(() => {
        loadCompressed('excerpts').then((data) => {
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
            contractVersion: state.contractVersion || 'v1.0',
            createdAt: state.createdAt.getTime(),
            excerpts: state.excerpts,
            footnotes: state.footnotes,
            headings: state.headings,
            lastUpdatedAt: state.lastUpdatedAt?.getTime(),
            options: state.options,
            prompt: state.prompt,
        };

        try {
            saveCompressed('excerpts', data);
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
                contractVersion: state.contractVersion || 'v1.0',
                createdAt: state.createdAt.getTime(),
                excerpts: state.excerpts,
                footnotes: state.footnotes,
                headings: state.headings,
                lastUpdatedAt: state.lastUpdatedAt?.getTime(),
                options: state.options,
                prompt: state.prompt,
            };

            downloadFile(name.endsWith('.json') ? name : `${name}.json`, JSON.stringify(data, null, 2));
        }
    }, []);

    const handleReset = useCallback(() => {
        record('ResetExcerpts');
        reset();
        setActiveTab('excerpts');
    }, [reset]);

    const handleApplyFormatting = useCallback(async () => {
        setIsFormattingLoading(true);
        try {
            record('ApplyALALCFormatting', activeTab);

            // Download rules from API
            const response = await fetch('/api/rules');
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

    if (!hasData) {
        return (
            <>
                <div className="flex min-h-screen flex-col p-8 font-[family-name:var(--font-geist-sans)] sm:p-20">
                    <div className="max-w flex w-full flex-col">
                        <h1 className="mb-6 font-bold text-3xl text-gray-800">Excerpts Editor</h1>
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
                    </div>
                </div>
                <VersionFooter />
            </>
        );
    }

    return (
        <>
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
                        <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
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
                            </TabsList>

                            <TabsContent className="mt-0" value="excerpts">
                                <VirtualizedList
                                    data={excerpts}
                                    getKey={(item) => item.id}
                                    header={
                                        <tr>
                                            <th className="w-32 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                                                Info
                                            </th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm">
                                                Arabic
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                                                Translation
                                            </th>
                                            <th className="w-16 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                                                Actions
                                            </th>
                                        </tr>
                                    }
                                    renderRow={(item) => (
                                        <ExcerptRow
                                            data={item}
                                            onDelete={(id) => deleteExcerpts([id])}
                                            onUpdate={updateExcerpt}
                                        />
                                    )}
                                />
                            </TabsContent>

                            <TabsContent className="mt-0" value="headings">
                                <VirtualizedList
                                    data={headings}
                                    getKey={(item) => item.id}
                                    header={
                                        <tr>
                                            <th className="w-24 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                                                From
                                            </th>
                                            <th className="w-24 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                                                Parent
                                            </th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm">
                                                Arabic
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                                                Translation
                                            </th>
                                            <th className="w-16 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                                                Actions
                                            </th>
                                        </tr>
                                    }
                                    renderRow={(item) => (
                                        <HeadingRow
                                            data={item}
                                            onDelete={(id) => deleteHeadings([id])}
                                            onUpdate={updateHeading}
                                        />
                                    )}
                                />
                            </TabsContent>

                            <TabsContent className="mt-0" value="footnotes">
                                <VirtualizedList
                                    data={footnotes}
                                    getKey={(item) => item.id}
                                    header={
                                        <tr>
                                            <th className="w-24 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                                                From
                                            </th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm">
                                                Arabic
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                                                Translation
                                            </th>
                                            <th className="w-16 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                                                Actions
                                            </th>
                                        </tr>
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
            <VersionFooter />
        </>
    );
}
