'use client';

import type { SegmentationOptions } from 'flappa-doormal';
import { toast } from 'sonner';

import { PanelContainer } from '@/components/PanelContainer';
import { ReplacementsTab } from '@/components/segmentation/ReplacementsTab';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type SegmentationPanelProps = { onClose: () => void };

export function SegmentationPanel({ onClose }: SegmentationPanelProps) {
    const options = useSegmentationStore((s) => s.options);
    const setOptions = useSegmentationStore((s) => s.setOptions);

    const initialValue = JSON.stringify(options, null, 4);
    const replacementCount = options.replace.length;

    return (
        <PanelContainer onCloseClicked={onClose} title="Segmentation">
            <Tabs className="flex min-h-0 flex-1 flex-col overflow-hidden" defaultValue="json">
                <TabsList className="mx-auto mt-2 w-fit">
                    <TabsTrigger value="json">JSON</TabsTrigger>
                    <TabsTrigger value="replacements">Replacements ({replacementCount})</TabsTrigger>
                </TabsList>

                <TabsContent className="min-h-0 flex-1 overflow-hidden" value="json">
                    <form
                        className="flex h-full flex-col gap-3 p-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const value = formData.get('options') as string;

                            let parsed: SegmentationOptions;
                            try {
                                parsed = JSON.parse(value) as SegmentationOptions;
                            } catch (err) {
                                toast.error(err instanceof Error ? err.message : 'Invalid JSON');
                                return;
                            }

                            setOptions(parsed);
                        }}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <Label htmlFor="segmentation-options-json">Options</Label>
                            <Button size="sm" type="submit">
                                Save
                            </Button>
                        </div>

                        <Textarea
                            className="min-h-0 flex-1 resize-none overflow-y-auto font-mono text-sm"
                            id="segmentation-options-json"
                            name="options"
                            spellCheck={false}
                            style={{ fieldSizing: 'fixed' }}
                            defaultValue={initialValue}
                        />
                    </form>
                </TabsContent>

                <TabsContent className="min-h-0 flex-1 overflow-hidden" value="replacements">
                    <ReplacementsTab />
                </TabsContent>
            </Tabs>
        </PanelContainer>
    );
}
