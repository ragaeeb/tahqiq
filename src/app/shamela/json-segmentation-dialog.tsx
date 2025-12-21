'use client';

import { analyzeCommonLineStarts, type CommonLineStartPattern, type SegmentationOptions } from 'flappa-doormal';
import { Loader2, XIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { convertContentToMarkdown } from 'shamela';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_OPTIONS, segmentShamelaPagesToExcerpts } from '@/lib/transform/excerpts';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import { useShamelaStore } from '@/stores/shamelaStore/useShamelaStore';

const DEFAULT_TOP_K = 100;
const DEFAULT_PREFIX_CHARS = 120;

type SegmentationPanelProps = { onClose: () => void };

/**
 * Container component for the left-side slide-in panel
 */
const PanelContainer = ({
    children,
    onCloseClicked,
}: Readonly<{ children: React.ReactNode; onCloseClicked: () => void }>) => {
    return (
        <Dialog modal={false} open>
            <DialogContent className="fixed top-0 right-auto left-0 flex h-full w-1/2 max-w-none translate-x-0 translate-y-0 flex-col rounded-none border-t-0 border-r border-b-0 border-l-0 p-0 [&>button]:hidden">
                <DialogHeader className="flex flex-shrink-0 flex-row items-center justify-between border-b bg-gray-50 p-4">
                    <DialogTitle className="text-left">Segment Pages</DialogTitle>
                    <DialogClose asChild>
                        <Button
                            className="rounded-sm p-1 opacity-70 hover:bg-red-100 hover:opacity-100"
                            onClick={onCloseClicked}
                            size="sm"
                            variant="ghost"
                        >
                            <XIcon />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                {children}
            </DialogContent>
        </Dialog>
    );
};

/**
 * Left-side slide-in panel for page segmentation with pattern analysis and JSON configuration
 */
export function SegmentationPanel({ onClose }: SegmentationPanelProps) {
    const router = useRouter();
    const [jsonText, setJsonText] = useState(DEFAULT_OPTIONS);
    const [error, setError] = useState<string | null>(null);
    const [lineStarts, setLineStarts] = useState<CommonLineStartPattern[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('patterns');
    const [topK, setTopK] = useState(DEFAULT_TOP_K);
    const [prefixChars, setPrefixChars] = useState(DEFAULT_PREFIX_CHARS);

    // Parse JSON and validate
    const parseOptions = useCallback((): SegmentationOptions | null => {
        try {
            const options = JSON.parse(jsonText) as SegmentationOptions;
            setError(null);
            return options;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid JSON');
            return null;
        }
    }, [jsonText]);

    // Analyze pages for common line starts
    const handleAnalyze = useCallback(() => {
        setIsAnalyzing(true);
        record('AnalyzeLineStarts');

        try {
            const shamelaPages = useShamelaStore.getState().pages;
            // Convert ShamelaPage to Page format (body -> content)
            const pages = shamelaPages.map((p) => ({ content: convertContentToMarkdown(p.body), id: p.id }));

            const results = analyzeCommonLineStarts(pages, { prefixChars, sortBy: 'count', topK });

            setLineStarts(results);
            toast.success(`Found ${results.length} common line start patterns`);
        } catch (err) {
            console.error('Analysis failed:', err);
            toast.error(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsAnalyzing(false);
        }
    }, [prefixChars, topK]);

    // Finalize and navigate to excerpts
    const handleFinalize = useCallback(async () => {
        const options = parseOptions();
        if (!options) {
            return;
        }

        record('FinalizeJsonSegmentation');

        try {
            toast.info('Segmenting pages...');

            const excerpts = segmentShamelaPagesToExcerpts(
                useShamelaStore.getState().pages,
                useShamelaStore.getState().titles,
                options,
            );

            useExcerptsStore.getState().init(excerpts);

            router.push('/excerpts');
            toast.success(`Created ${excerpts.excerpts.length} segments`);
        } catch (err) {
            console.error('Segmentation failed:', err);
            toast.error(`Segmentation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }, [parseOptions, router]);

    return (
        <PanelContainer onCloseClicked={onClose}>
            <Tabs className="flex flex-1 flex-col overflow-hidden" onValueChange={setActiveTab} value={activeTab}>
                <TabsList className="mx-4 mt-4 w-fit">
                    <TabsTrigger value="patterns">Patterns</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>

                {/* Patterns Tab */}
                <TabsContent className="flex flex-1 flex-col overflow-hidden px-4" value="patterns">
                    <div className="mb-4 space-y-3">
                        <div className="flex items-center gap-4">
                            <Label className="w-28 shrink-0">Top K: {topK}</Label>
                            <Slider
                                className="flex-1"
                                max={200}
                                min={10}
                                onValueChange={([value]) => setTopK(value)}
                                step={10}
                                value={[topK]}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="w-28 shrink-0">Prefix: {prefixChars}</Label>
                            <Slider
                                className="flex-1"
                                max={200}
                                min={20}
                                onValueChange={([value]) => setPrefixChars(value)}
                                step={10}
                                value={[prefixChars]}
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1 rounded-lg border">
                        {lineStarts.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 border-b bg-background">
                                    <tr>
                                        <th className="px-2 py-1 text-left font-medium">Pattern</th>
                                        <th className="w-16 px-2 py-1 text-right font-medium">Count</th>
                                        <th className="px-2 py-1 text-right font-medium" dir="rtl">
                                            Example
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineStarts.map((result) => {
                                        const example = result.examples?.[0];
                                        return (
                                            <tr
                                                className="cursor-pointer border-b hover:bg-muted/50"
                                                key={result.pattern}
                                                onClick={() => {
                                                    if (example?.pageId) {
                                                        window.location.hash = `#${example.pageId}`;
                                                    }
                                                }}
                                            >
                                                <td className="px-2 py-1 font-mono text-xs">{result.pattern}</td>
                                                <td className="px-2 py-1 text-right tabular-nums">{result.count}</td>
                                                <td
                                                    className="max-w-40 truncate px-2 py-1 text-right text-muted-foreground"
                                                    dir="rtl"
                                                    title={example?.line}
                                                >
                                                    {example?.line}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex h-full items-center justify-center p-4 text-muted-foreground">
                                Click "Analyze Pages" to detect common line start patterns
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>

                {/* JSON Tab */}
                <TabsContent className="flex flex-1 flex-col overflow-hidden px-4" value="json">
                    <div className="flex flex-1 flex-col space-y-4 overflow-hidden">
                        <div className="flex flex-1 flex-col">
                            <Label htmlFor="json-options">Segmentation Options (JSON)</Label>
                            <Textarea
                                className="mt-2 flex-1 font-mono text-sm"
                                id="json-options"
                                onChange={(e) => {
                                    setJsonText(e.target.value);
                                    setError(null);
                                }}
                                placeholder="Paste JSON options here..."
                                value={jsonText}
                            />
                        </div>
                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
                        )}
                    </div>
                </TabsContent>

                {/* Footer - buttons change based on active tab */}
                <div className="flex flex-shrink-0 justify-end gap-2 border-t bg-gray-50 p-4">
                    <Button onClick={onClose} variant="ghost">
                        Cancel
                    </Button>
                    {activeTab === 'patterns' ? (
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
                    ) : (
                        <Button onClick={handleFinalize}>Segment Pages</Button>
                    )}
                </div>
            </Tabs>
        </PanelContainer>
    );
}
