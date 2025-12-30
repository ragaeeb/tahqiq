'use client';

import {
    analyzeCommonLineStarts,
    analyzeTextForRule,
    expandCompositeTokensInTemplate,
    type SegmentationOptions,
} from 'flappa-doormal';
import { htmlToMarkdown } from 'ketab-online-sdk';
import { Loader2, PlusIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { JsonTab, useJsonTextareaValue } from '@/app/shamela/segmentation/JsonTab';
import { PatternsTab } from '@/app/shamela/segmentation/PatternsTab';
import { PreviewTab } from '@/app/shamela/segmentation/PreviewTab';
import { ReplacementsTab } from '@/app/shamela/segmentation/ReplacementsTab';
import { RulesTab } from '@/app/shamela/segmentation/RulesTab';
import { PanelContainer } from '@/components/PanelContainer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEGMENTATION_DEFAULT_PREFIX_CHARS, SEGMENTATION_FETCH_ALL_TOP_K } from '@/lib/constants';
import { segmentKetabPagesToExcerpts } from '@/lib/transform/ketab-excerpts';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import { useKetabStore } from '@/stores/ketabStore/useKetabStore';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type SegmentationPanelProps = { onClose: () => void };

type AnalyzedRule = { template: string; patternType: string; fuzzy: boolean; metaType: string };

/**
 * Left-side slide-in panel for page segmentation with pattern analysis and JSON configuration
 * This is the Ketab-specific version that uses ketabStore
 */
export function SegmentationPanel({ onClose }: SegmentationPanelProps) {
    const router = useRouter();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('patterns');
    const [detectedRules, setDetectedRules] = useState<AnalyzedRule[]>([]);

    const { allLineStarts, replacements, ruleConfigs, setAllLineStarts } = useSegmentationStore();
    const getJsonTextareaValue = useJsonTextareaValue();

    // Add rule from selected text
    const handleAddFromSelection = useCallback(() => {
        const selectedText = window.getSelection()?.toString().trim();
        if (!selectedText) {
            toast.error('Please select text from the Ketab page first');
            return;
        }

        try {
            const result = analyzeTextForRule(selectedText);

            if (!result) {
                toast.error('Could not analyze the selected text');
                return;
            }

            // Check if similar rule already exists
            const existing = detectedRules.find((r) => r.template === result.template);
            if (existing) {
                toast.info('This pattern is already detected');
                return;
            }

            setDetectedRules((prev) => [
                ...prev,
                {
                    fuzzy: result.fuzzy,
                    metaType: result.metaType ?? '',
                    patternType: result.patternType,
                    template: result.template,
                },
            ]);

            toast.success(`Detected: ${result.template}`);
        } catch (err) {
            console.error('Failed to analyze text:', err);
            toast.error('Failed to analyze selected text');
        }
    }, [detectedRules]);

    // Parse and get options from JSON textarea
    const getOptions = useCallback((): SegmentationOptions | null => {
        try {
            const jsonValue = getJsonTextareaValue();
            return JSON.parse(jsonValue) as SegmentationOptions;
        } catch {
            toast.error('Invalid JSON in options');
            return null;
        }
    }, [getJsonTextareaValue]);

    // Analyze pages for common line starts
    const handleAnalyze = useCallback(() => {
        setIsAnalyzing(true);
        record('AnalyzeKetabLineStarts');

        try {
            const ketabPages = useKetabStore.getState().pages;
            // Convert HTML to markdown for analysis
            const pages = ketabPages.map((p) => ({ content: htmlToMarkdown(p.body), id: p.id }));

            const results = analyzeCommonLineStarts(pages, {
                prefixChars: SEGMENTATION_DEFAULT_PREFIX_CHARS,
                sortBy: 'count',
                topK: SEGMENTATION_FETCH_ALL_TOP_K,
            });

            // Expand composite tokens to base forms
            const expandedResults = results.map((r) => ({ ...r, pattern: expandCompositeTokensInTemplate(r.pattern) }));

            setAllLineStarts(expandedResults);
            toast.success(`Found ${expandedResults.length} patterns`);
        } catch (err) {
            console.error('Analysis failed:', err);
            toast.error(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsAnalyzing(false);
        }
    }, [setAllLineStarts]);

    // Auto-analyze on first open if no results exist
    const hasAutoAnalyzed = useRef(false);
    useEffect(() => {
        if (!hasAutoAnalyzed.current && allLineStarts.length === 0) {
            hasAutoAnalyzed.current = true;
            handleAnalyze();
        }
    }, [allLineStarts.length, handleAnalyze]);

    // Finalize and navigate to excerpts
    const handleFinalize = useCallback(() => {
        const options = getOptions();
        if (!options) {
            return;
        }

        record('FinalizeKetabJsonSegmentation');

        try {
            toast.info('Segmenting pages...');

            const excerpts = segmentKetabPagesToExcerpts(
                useKetabStore.getState().pages,
                useKetabStore.getState().titles,
                options,
            );

            useExcerptsStore.getState().init(excerpts);

            router.push('/excerpts');
            toast.success(`Created ${excerpts.excerpts.length} segments`);
        } catch (err) {
            console.error('Segmentation failed:', err);
            toast.error(`Segmentation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }, [getOptions, router]);

    return (
        <PanelContainer onCloseClicked={onClose}>
            <Tabs className="flex flex-1 flex-col overflow-hidden" onValueChange={setActiveTab} value={activeTab}>
                <TabsList className="mx-auto mt-2 w-fit">
                    <TabsTrigger value="patterns">Patterns ({allLineStarts.length})</TabsTrigger>
                    <TabsTrigger value="rules">Rules ({ruleConfigs.length})</TabsTrigger>
                    <TabsTrigger value="replacements">Replacements ({replacements.length})</TabsTrigger>
                    <TabsTrigger disabled={ruleConfigs.length === 0} value="preview">
                        Preview
                    </TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>

                {/* Patterns Tab */}
                <TabsContent className="flex flex-1 flex-col overflow-hidden px-3 pt-2" value="patterns">
                    <PatternsTab
                        detectedRules={detectedRules}
                        onRemoveDetectedRule={(idx: number) =>
                            setDetectedRules((prev) => prev.filter((_, i) => i !== idx))
                        }
                    />
                </TabsContent>

                {/* Rules Tab */}
                <TabsContent className="flex flex-1 flex-col overflow-hidden px-3 pt-2" value="rules">
                    <RulesTab />
                </TabsContent>

                {/* JSON Tab */}
                <TabsContent className="flex flex-1 flex-col overflow-hidden px-3 pt-2" value="json">
                    <JsonTab />
                </TabsContent>

                {/* Replacements Tab */}
                <TabsContent className="flex flex-1 flex-col overflow-hidden px-3 pt-2" value="replacements">
                    <ReplacementsTab />
                </TabsContent>

                {/* Preview Tab */}
                <TabsContent className="flex flex-1 flex-col overflow-hidden" value="preview">
                    <PreviewTab />
                </TabsContent>

                {/* Footer */}
                <div className="flex flex-shrink-0 justify-end gap-2 border-t bg-gray-50 p-4">
                    <Button onClick={onClose} variant="ghost">
                        Cancel
                    </Button>
                    {activeTab === 'patterns' ? (
                        <>
                            <Button onClick={handleAddFromSelection} variant="outline">
                                <PlusIcon className="mr-1 h-4 w-4" />
                                Add from Selection
                            </Button>
                            <Button disabled={isAnalyzing} onClick={handleAnalyze}>
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    'Analyze Pages'
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleFinalize}>Segment Pages</Button>
                    )}
                </div>
            </Tabs>
        </PanelContainer>
    );
}
