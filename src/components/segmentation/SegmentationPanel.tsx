'use client';

import type { Page, Segment, SegmentationOptions } from 'flappa-doormal';
import { segmentPages } from 'flappa-doormal';
import { record } from 'nanolytics';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PanelContainer } from '@/components/PanelContainer';
import { AnalysisTab } from '@/components/segmentation/AnalysisTab';
import { JsonTab } from '@/components/segmentation/JsonTab';
import { PreviewTab } from '@/components/segmentation/PreviewTab';
import { ReplacementsTab } from '@/components/segmentation/ReplacementsTab';
import { RulesTab } from '@/components/segmentation/RulesTab';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { segmentFlappaPagesToExcerpts } from '@/lib/transform/excerpts';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type SegmentationPanelProps = {
    onClose: () => void;
    pages: Page[];
    onCreateExcerpts?: (segments: Segment[], options: SegmentationOptions) => unknown;
};

export function SegmentationPanel({ onClose, onCreateExcerpts, pages }: SegmentationPanelProps) {
    const options = useSegmentationStore((s) => s.options);
    const analysisCount = useSegmentationStore((s) => s.allLineStarts.length);
    const replacementCount = options.replace.length;
    const rulesCount = options.rules.length;
    const router = useRouter();

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
                    <AnalysisTab pages={pages} />
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

                <div className="flex flex-shrink-0 justify-end gap-2 border-t bg-gray-50 p-4">
                    <Button onClick={onClose} type="button" variant="ghost">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            record('SegmentFromSharedPanel');
                            try {
                                toast.info('Segmenting pages...');
                                const segments = segmentPages(pages, options);
                                const excerpts = onCreateExcerpts
                                    ? (onCreateExcerpts(segments, options) as any)
                                    : segmentFlappaPagesToExcerpts(pages, options);

                                useExcerptsStore.getState().init(excerpts);
                                router.push('/excerpts');
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
            </Tabs>
        </PanelContainer>
    );
}
