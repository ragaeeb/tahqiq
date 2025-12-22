'use client';

import { areSimilarAfterNormalization } from 'baburchi';
import {
    analyzeCommonLineStarts,
    analyzeTextForRule,
    type CommonLineStartPattern,
    type SegmentationOptions,
} from 'flappa-doormal';
import { Loader2, PlusIcon, XIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { convertContentToMarkdown } from 'shamela';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
const DEFAULT_MIN_COUNT = 2;
const SIMILARITY_THRESHOLD = 0.7;
const FETCH_ALL_TOP_K = 10000; // Fetch all patterns, filter locally

type SegmentationPanelProps = { onClose: () => void };

type AnalyzedRule = { template: string; patternType: string; fuzzy: boolean; metaType: string };

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
 * Finds patterns that are similar to the selected patterns (likely typos)
 */
const findSimilarPatterns = (
    selectedPatterns: Set<string>,
    allPatterns: CommonLineStartPattern[],
    threshold: number,
): CommonLineStartPattern[] => {
    if (selectedPatterns.size === 0) {
        return [];
    }

    const similar: CommonLineStartPattern[] = [];
    const selectedArray = Array.from(selectedPatterns);

    for (const pattern of allPatterns) {
        // Skip if already selected
        if (selectedPatterns.has(pattern.pattern)) {
            continue;
        }

        // Check if this pattern is similar to any selected pattern
        for (const selected of selectedArray) {
            if (areSimilarAfterNormalization(pattern.pattern, selected, threshold)) {
                similar.push(pattern);
                break; // Found a match, no need to check others
            }
        }
    }

    return similar.sort((a, b) => b.count - a.count);
};

/**
 * Builds a tooltip string with count and up to 3 example lines
 */
const buildPatternTooltip = (pattern: CommonLineStartPattern): string => {
    const lines = [`Count: ${pattern.count}`];
    const examples = pattern.examples?.slice(0, 3) ?? [];
    if (examples.length > 0) {
        lines.push('Examples:');
        for (const ex of examples) {
            lines.push(`• ${ex.line.slice(0, 60)}${ex.line.length > 60 ? '...' : ''}`);
        }
    }
    return lines.join('\n');
};

/**
 * Reusable pattern chip with click-to-navigate and action button (add/remove)
 */
const PatternChip = ({
    colorScheme,
    mode = 'remove',
    onAction,
    pattern,
    showCount = true,
}: {
    colorScheme: 'blue' | 'red' | 'amber';
    mode?: 'add' | 'remove';
    onAction: () => void;
    pattern: CommonLineStartPattern;
    showCount?: boolean;
}) => {
    const colors = {
        amber: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
        blue: 'bg-blue-200 text-blue-800 hover:bg-blue-300',
        red: 'bg-red-100 text-red-800 hover:bg-red-200',
    };
    const actionColors = {
        add: {
            amber: 'text-green-600 hover:text-green-800 hover:bg-amber-200',
            blue: 'text-green-600 hover:text-green-800 hover:bg-blue-300',
            red: 'text-green-600 hover:text-green-800 hover:bg-red-200',
        },
        remove: {
            amber: 'text-amber-600 hover:text-red-600 hover:bg-amber-200',
            blue: 'text-blue-600 hover:text-red-600 hover:bg-blue-300',
            red: 'text-red-600 hover:text-red-800 hover:bg-red-200',
        },
    };

    const example = pattern.examples?.[0];

    return (
        <span className={`inline-flex items-center gap-0.5 rounded font-mono text-xs ${colors[colorScheme]}`}>
            <button
                className="cursor-pointer px-1.5 py-0.5"
                onClick={() => {
                    if (example?.pageId) {
                        window.location.hash = `#${example.pageId}`;
                    }
                }}
                title={buildPatternTooltip(pattern)}
                type="button"
            >
                {pattern.pattern}
                {showCount && ` (${pattern.count})`}
            </button>
            <button
                className={`rounded-r px-0.5 py-0.5 ${actionColors[mode][colorScheme]}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onAction();
                }}
                title={mode === 'add' ? 'Add to selection' : 'Remove'}
                type="button"
            >
                {mode === 'add' ? <PlusIcon className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
            </button>
        </span>
    );
};

/**
 * Left-side slide-in panel for page segmentation with pattern analysis and JSON configuration
 */
export function SegmentationPanel({ onClose }: SegmentationPanelProps) {
    const router = useRouter();
    const [jsonText, setJsonText] = useState(DEFAULT_OPTIONS);
    const [error, setError] = useState<string | null>(null);
    const [allLineStarts, setAllLineStarts] = useState<CommonLineStartPattern[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('patterns');
    const [topK, setTopK] = useState(DEFAULT_TOP_K);
    const [prefixChars, setPrefixChars] = useState(DEFAULT_PREFIX_CHARS);
    const [minCount, setMinCount] = useState(DEFAULT_MIN_COUNT);
    const [selectedPatterns, setSelectedPatterns] = useState<Set<string>>(new Set());
    const [detectedRules, setDetectedRules] = useState<AnalyzedRule[]>([]);

    // Filter patterns locally based on topK and minCount
    const filteredLineStarts = useMemo(() => {
        return allLineStarts.filter((p) => p.count >= minCount).slice(0, topK);
    }, [allLineStarts, topK, minCount]);

    // Set of patterns that appear in the filtered table
    const filteredPatternSet = useMemo(() => {
        return new Set(filteredLineStarts.map((p) => p.pattern));
    }, [filteredLineStarts]);

    // Find patterns similar to selected ones (potential typos)
    const similarPatterns = useMemo(() => {
        return findSimilarPatterns(selectedPatterns, allLineStarts, SIMILARITY_THRESHOLD);
    }, [selectedPatterns, allLineStarts]);

    // Split similar patterns into visible (in table) and hidden (not in table)
    const { visibleSimilar, hiddenSimilar } = useMemo(() => {
        const visible: CommonLineStartPattern[] = [];
        const hidden: CommonLineStartPattern[] = [];
        for (const p of similarPatterns) {
            if (filteredPatternSet.has(p.pattern)) {
                visible.push(p);
            } else {
                hidden.push(p);
            }
        }
        return { hiddenSimilar: hidden, visibleSimilar: visible };
    }, [similarPatterns, filteredPatternSet]);

    // Get selected pattern objects (for display)
    const selectedPatternObjects = useMemo(() => {
        return allLineStarts.filter((p) => selectedPatterns.has(p.pattern));
    }, [selectedPatterns, allLineStarts]);

    // Toggle pattern selection
    const togglePattern = useCallback((pattern: string) => {
        setSelectedPatterns((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(pattern)) {
                newSet.delete(pattern);
            } else {
                newSet.add(pattern);
            }
            return newSet;
        });
    }, []);

    // Add rule from selected text
    const handleAddFromSelection = useCallback(() => {
        const selectedText = window.getSelection()?.toString().trim();
        if (!selectedText) {
            toast.error('Please select text from the Shamela page first');
            return;
        }

        record('AddRuleFromSelection', selectedText);

        try {
            const result = analyzeTextForRule(selectedText);
            if (!result || !result.template) {
                toast.warning('Could not detect any pattern tokens in the selected text');
                return;
            }

            const newRule: AnalyzedRule = {
                fuzzy: result.fuzzy,
                metaType: result.metaType ?? '',
                patternType: result.patternType,
                template: result.template,
            };

            // Check for duplicates
            if (detectedRules.some((r) => r.template === newRule.template)) {
                toast.warning('This rule pattern already exists');
                return;
            }

            setDetectedRules((prev) => [...prev, newRule]);
            toast.success(`Detected: ${result.template}`);
        } catch (err) {
            console.error('Failed to analyze text:', err);
            toast.error('Failed to analyze selected text');
        }
    }, [detectedRules]);

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

            // Fetch ALL patterns, we'll filter locally
            const results = analyzeCommonLineStarts(pages, { prefixChars, sortBy: 'count', topK: FETCH_ALL_TOP_K });

            setAllLineStarts(results);
            setSelectedPatterns(new Set()); // Clear selections on re-analyze
            toast.success(`Found ${results.length} patterns`);
        } catch (err) {
            console.error('Analysis failed:', err);
            toast.error(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsAnalyzing(false);
        }
    }, [prefixChars]);

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
                    <TabsTrigger value="patterns">Patterns ({allLineStarts.length})</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>

                {/* Patterns Tab */}
                <TabsContent className="flex flex-1 flex-col overflow-hidden px-4" value="patterns">
                    {/* Sliders */}
                    <div className="mb-4 space-y-3">
                        <div className="flex items-center gap-4">
                            <Label className="w-28 shrink-0">Top K: {topK}</Label>
                            <Slider
                                className="flex-1"
                                max={500}
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
                        <div className="flex items-center gap-4">
                            <Label className="w-28 shrink-0">Min Count: {minCount}</Label>
                            <Slider
                                className="flex-1"
                                max={20}
                                min={1}
                                onValueChange={([value]) => setMinCount(value)}
                                step={1}
                                value={[minCount]}
                            />
                        </div>
                    </div>
                    {/* Detected Rules from Selection */}
                    {detectedRules.length > 0 && (
                        <div className="mb-4 space-y-2 rounded-lg border border-green-200 bg-green-50 p-3">
                            <div className="font-medium text-green-800">
                                Rules from Selection ({detectedRules.length})
                            </div>
                            <div className="space-y-1">
                                {detectedRules.map((rule, idx) => (
                                    <div
                                        className="flex items-center justify-between rounded bg-green-100 px-2 py-1"
                                        key={rule.template}
                                    >
                                        <div className="flex items-center gap-2">
                                            <code className="font-mono text-green-800 text-xs">{rule.template}</code>
                                            <span className="rounded bg-green-200 px-1 text-green-700 text-xs">
                                                {rule.patternType}
                                            </span>
                                            {rule.fuzzy && (
                                                <span className="rounded bg-yellow-200 px-1 text-xs text-yellow-700">
                                                    fuzzy
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            className="text-green-600 hover:text-red-600"
                                            onClick={() => setDetectedRules((prev) => prev.filter((_, i) => i !== idx))}
                                            title="Remove rule"
                                            type="button"
                                        >
                                            <XIcon className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Selected Patterns Section */}
                    {selectedPatterns.size > 0 && (
                        <div className="mb-4 space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <div className="font-medium text-blue-800">Selected Patterns ({selectedPatterns.size})</div>
                            <div className="flex flex-wrap gap-1">
                                {selectedPatternObjects.map((p) => (
                                    <PatternChip
                                        colorScheme="blue"
                                        key={p.pattern}
                                        onAction={() => togglePattern(p.pattern)}
                                        pattern={p}
                                        showCount={false}
                                    />
                                ))}
                            </div>

                            {/* Similar Patterns (Typos) */}
                            {similarPatterns.length > 0 && (
                                <div className="mt-3 border-blue-200 border-t pt-2">
                                    {/* Hidden typos (not in table) - RED - most concerning */}
                                    {hiddenSimilar.length > 0 && (
                                        <>
                                            <div className="mb-1 font-medium text-red-700 text-sm">
                                                Hidden typos (not in table): {hiddenSimilar.length}
                                            </div>
                                            <div className="mb-2 flex flex-wrap gap-1">
                                                {hiddenSimilar.slice(0, 15).map((p) => (
                                                    <PatternChip
                                                        colorScheme="red"
                                                        key={p.pattern}
                                                        mode="add"
                                                        onAction={() => togglePattern(p.pattern)}
                                                        pattern={p}
                                                    />
                                                ))}
                                                {hiddenSimilar.length > 15 && (
                                                    <span className="text-red-600 text-xs">
                                                        +{hiddenSimilar.length - 15} more
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Visible typos (in table) - AMBER - less concerning */}
                                    {visibleSimilar.length > 0 && (
                                        <>
                                            <div className="mb-1 text-amber-700 text-sm">
                                                Also in table: {visibleSimilar.length}
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {visibleSimilar.slice(0, 10).map((p) => (
                                                    <PatternChip
                                                        colorScheme="amber"
                                                        key={p.pattern}
                                                        mode="add"
                                                        onAction={() => togglePattern(p.pattern)}
                                                        pattern={p}
                                                    />
                                                ))}
                                                {visibleSimilar.length > 10 && (
                                                    <span className="text-amber-600 text-xs">
                                                        +{visibleSimilar.length - 10} more
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {/* Patterns Table */}
                    <ScrollArea className="min-h-0 flex-1 rounded-lg border">
                        {filteredLineStarts.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 border-b bg-background">
                                    <tr>
                                        <th className="w-8 px-2 py-1" />
                                        <th className="px-2 py-1 text-left font-medium">Pattern</th>
                                        <th className="w-16 px-2 py-1 text-right font-medium">Count</th>
                                        <th className="px-2 py-1 text-right font-medium" dir="rtl">
                                            Example
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLineStarts.map((result) => {
                                        const example = result.examples?.[0];
                                        const isSelected = selectedPatterns.has(result.pattern);
                                        return (
                                            <tr
                                                className={`cursor-pointer border-b hover:bg-muted/50 ${isSelected ? 'bg-blue-50' : ''}`}
                                                key={result.pattern}
                                            >
                                                <td className="px-2 py-1">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => togglePattern(result.pattern)}
                                                    />
                                                </td>
                                                <td className="px-2 py-1">
                                                    <button
                                                        className="w-full text-left font-mono text-xs hover:underline"
                                                        onClick={() => {
                                                            if (example?.pageId) {
                                                                window.location.hash = `#${example.pageId}`;
                                                            }
                                                        }}
                                                        type="button"
                                                    >
                                                        {result.pattern}
                                                    </button>
                                                </td>
                                                <td className="px-2 py-1 text-right tabular-nums">{result.count}</td>
                                                <td className="px-2 py-1" dir="rtl">
                                                    <button
                                                        className="w-full max-w-40 truncate text-right text-muted-foreground hover:underline"
                                                        onClick={() => {
                                                            if (example?.pageId) {
                                                                window.location.hash = `#${example.pageId}`;
                                                            }
                                                        }}
                                                        title={example?.line}
                                                        type="button"
                                                    >
                                                        {example?.line}
                                                    </button>
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
