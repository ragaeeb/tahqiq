'use client';

import type { Page } from 'flappa-doormal';
import { record } from 'nanolytics';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { PanelContainer } from '@/components/PanelContainer';
import { AnalysisTab } from '@/components/segmentation/AnalysisTab';
import { JsonTab } from '@/components/segmentation/JsonTab';
import { PreviewTab } from '@/components/segmentation/PreviewTab';
import { ReplacementsTab } from '@/components/segmentation/ReplacementsTab';
import { RulesTab } from '@/components/segmentation/RulesTab';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { applyReplacements } from '@/lib/replace';
import { mapPagesToExcerpts } from '@/lib/segmentation';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type SegmentationPanelProps = { onClose: () => void; pages: Page[]; headings: Page[] };

export function SegmentationPanel({ onClose, pages, headings }: SegmentationPanelProps) {
    const options = useSegmentationStore((s) => s.options);
    const analysisCount = useSegmentationStore((s) => s.allLineStarts.length);
    const replaceRules = options.replace;
    const replacementCount = replaceRules?.length ?? 0;
    const rulesCount = options.rules?.length ?? 0;
    const router = useRouter();

    const processedPages = useMemo(() => applyReplacements(pages, replaceRules), [pages, replaceRules]);

    return (
        <PanelContainer onCloseClicked={onClose} title="Segmentation">
            <Tabs className="flex min-h-0 flex-1 flex-col overflow-hidden" defaultValue="json">
                <TabsList className="mx-auto mt-2 w-fit">
                    <TabsTrigger value="json">JSON</TabsTrigger>
                    <TabsTrigger value="analysis">
                        {analysisCount > 0 ? `Analysis (${analysisCount})` : 'Analysis'}
                    </TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="rules">Rules ({rulesCount})</TabsTrigger>
                    <TabsTrigger value="replacements">Replacements ({replacementCount})</TabsTrigger>
                </TabsList>

                <TabsContent className="flex min-h-0 flex-1 flex-col overflow-hidden" value="json">
                    <JsonTab />
                </TabsContent>

                <TabsContent className="flex min-h-0 flex-1 flex-col overflow-hidden" value="analysis">
                    <AnalysisTab pages={processedPages} />
                </TabsContent>

                <TabsContent className="flex min-h-0 flex-1 flex-col overflow-hidden" value="preview">
                    <PreviewTab pages={pages} />
                </TabsContent>

                <TabsContent className="flex min-h-0 flex-1 flex-col overflow-hidden" value="rules">
                    <RulesTab />
                </TabsContent>

                <TabsContent className="flex min-h-0 flex-1 flex-col overflow-hidden" value="replacements">
                    <ReplacementsTab />
                </TabsContent>

                <div className="flex flex-shrink-0 items-center justify-end gap-4 border-t bg-gray-50 p-4">
                    <div className="flex gap-2">
                        <Button onClick={onClose} type="button" variant="ghost">
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                record('SegmentFromSharedPanel');
                                try {
                                    const id = toast.info('Segmenting pages...');

                                    const excerpts = mapPagesToExcerpts(pages, headings, options);
                                    useExcerptsStore.getState().init(excerpts);

                                    router.push('/excerpts');

                                    toast.dismiss(id);
                                    toast.success(`Created ${excerpts.excerpts.length} segments`);
                                } catch (err) {
                                    console.error(err);
                                    toast.error(
                                        `Segmentation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                                    );
                                }
                            }}
                            type="button"
                        >
                            Segment
                        </Button>
                    </div>
                </div>
            </Tabs>
        </PanelContainer>
    );
}
