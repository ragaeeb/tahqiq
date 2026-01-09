'use client';

import { analyzeCommonLineStarts, type CommonLineStartPattern, type Page, type SplitRule } from 'flappa-doormal';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
    SEGMENTATION_DEFAULT_MIN_COUNT,
    SEGMENTATION_DEFAULT_PREFIX_CHARS,
    SEGMENTATION_FETCH_ALL_TOP_K,
} from '@/lib/constants';
import { doesRuleAlreadyExist } from '@/lib/rules';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type AnalysisTabProps = { pages: Page[] };

const isPureHeadingMarker = (pattern: string) => pattern.replace(/\\s\*/g, '').trim().match(/^#+$/u);

const ExamplesDialogContent = ({ pattern }: { pattern: CommonLineStartPattern }) => {
    return (
        <DialogContent className="!max-w-[90vw] flex h-[85vh] w-[90vw] flex-col">
            <DialogHeader>
                <DialogTitle className="font-mono text-sm">{pattern.pattern}</DialogTitle>
                <DialogDescription>
                    {pattern.count.toLocaleString()} matches • showing {pattern.examples.length.toLocaleString()}{' '}
                    examples
                </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 border-b bg-background">
                        <tr>
                            <th className="w-20 px-2 py-2 text-left font-medium">Page</th>
                            <th className="px-2 py-2 text-right font-medium" dir="rtl">
                                Line
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {pattern.examples.map((ex, idx) => (
                            <tr className="border-b" key={`${ex.pageId}-${idx}`}>
                                <td className="px-2 py-2 text-left text-muted-foreground text-xs tabular-nums">
                                    {ex.pageId}
                                </td>
                                <td className="px-2 py-2 text-right font-arabic text-sm" dir="rtl">
                                    {ex.line}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DialogContent>
    );
};

export const AnalysisTab = ({ pages }: AnalysisTabProps) => {
    const rules = useSegmentationStore((s) => s.options.rules);
    const updateOptions = useSegmentationStore((s) => s.updateOptions);

    const results = useSegmentationStore((s) => s.allLineStarts);
    const setAllLineStarts = useSegmentationStore((s) => s.setAllLineStarts);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [topK, setTopK] = useState(SEGMENTATION_FETCH_ALL_TOP_K);
    const [minCount, setMinCount] = useState(SEGMENTATION_DEFAULT_MIN_COUNT);
    const [prefixChars, setPrefixChars] = useState(SEGMENTATION_DEFAULT_PREFIX_CHARS);
    const [maxExamples, setMaxExamples] = useState(100);
    const [minLineLength, setMinLineLength] = useState(6);
    const [sortBy, setSortBy] = useState<'specificity' | 'count'>('count');
    const [whitespace, setWhitespace] = useState<'regex' | 'space'>('regex');
    const [normalizeArabicDiacritics, setNormalizeArabicDiacritics] = useState(true);
    const [includeFirstWordFallback, setIncludeFirstWordFallback] = useState(true);

    const addRuleFromPattern = (pattern: string) => {
        if (doesRuleAlreadyExist(rules, pattern)) {
            toast.info('Rule already exists');
            return;
        }
        const next: SplitRule[] = [...rules, { lineStartsWith: [pattern] }];
        updateOptions({ rules: next });
        toast.success('Added rule');
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-3">
            <div className="flex items-center justify-between">
                <Label>Analysis (Line Starts)</Label>
                <Button
                    onClick={() => {
                        setIsAnalyzing(true);
                        try {
                            const analyzed = analyzeCommonLineStarts(pages, {
                                includeFirstWordFallback,
                                maxExamples,
                                minCount,
                                minLineLength,
                                normalizeArabicDiacritics,
                                prefixChars,
                                sortBy,
                                topK,
                                whitespace,
                            }).filter((p) => !isPureHeadingMarker(p.pattern));

                            setAllLineStarts(analyzed);
                        } catch (err) {
                            // keep it simple
                            console.error(err);
                        } finally {
                            setIsAnalyzing(false);
                        }
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                >
                    {isAnalyzing ? 'Analyzing…' : 'Analyze Pages'}
                </Button>
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
                <div className="mb-2 text-muted-foreground text-xs">Options</div>

                <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Label className="w-28 shrink-0 text-xs">Top K: {topK}</Label>
                            <Slider
                                className="flex-1"
                                max={10000}
                                min={50}
                                onValueChange={([v]) => setTopK(v)}
                                step={50}
                                value={[topK]}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Label className="w-28 shrink-0 text-xs">Min Count: {minCount}</Label>
                            <Slider
                                className="flex-1"
                                max={20}
                                min={1}
                                onValueChange={([v]) => setMinCount(v)}
                                step={1}
                                value={[minCount]}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Label className="w-28 shrink-0 text-xs">Prefix Chars: {prefixChars}</Label>
                            <Slider
                                className="flex-1"
                                max={300}
                                min={20}
                                onValueChange={([v]) => setPrefixChars(v)}
                                step={10}
                                value={[prefixChars]}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Label className="w-28 shrink-0 text-xs">Max Examples: {maxExamples}</Label>
                            <Slider
                                className="flex-1"
                                max={200}
                                min={1}
                                onValueChange={([v]) => setMaxExamples(v)}
                                step={1}
                                value={[maxExamples]}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Label className="w-28 shrink-0 text-xs">Min Line Len: {minLineLength}</Label>
                            <Slider
                                className="flex-1"
                                max={40}
                                min={1}
                                onValueChange={([v]) => setMinLineLength(v)}
                                step={1}
                                value={[minLineLength]}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Select onValueChange={(v) => setSortBy(v as 'specificity' | 'count')} value={sortBy}>
                                <SelectTrigger size="sm">
                                    <SelectValue placeholder="sortBy" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="count">sortBy: count</SelectItem>
                                    <SelectItem value="specificity">sortBy: specificity</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select onValueChange={(v) => setWhitespace(v as 'regex' | 'space')} value={whitespace}>
                                <SelectTrigger size="sm">
                                    <SelectValue placeholder="whitespace" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="regex">whitespace: regex</SelectItem>
                                    <SelectItem value="space">whitespace: space</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={normalizeArabicDiacritics}
                                    onCheckedChange={(v) => setNormalizeArabicDiacritics(Boolean(v))}
                                />
                                <Label className="text-xs">normalize diacritics</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={includeFirstWordFallback}
                                    onCheckedChange={(v) => setIncludeFirstWordFallback(Boolean(v))}
                                />
                                <Label className="text-xs">first-word fallback</Label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ScrollArea className="min-h-0 flex-1 rounded-md border">
                {results.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-6 text-muted-foreground text-sm">
                        Run “Analyze Pages” to detect common line-start patterns.
                    </div>
                ) : (
                    <table className="w-full text-xs">
                        <thead className="sticky top-0 border-b bg-background">
                            <tr>
                                <th className="w-10 px-2 py-1" />
                                <th className="px-2 py-1 text-left font-medium">Pattern</th>
                                <th className="w-24 px-2 py-1 text-right font-medium">Count</th>
                                <th className="px-2 py-1 text-right font-medium" dir="rtl">
                                    Example
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((p) => {
                                const example = p.examples?.[0]?.line ?? '';
                                return (
                                    <tr className="border-b" key={p.pattern}>
                                        <td className="px-2 py-1">
                                            <Button
                                                className="h-7 w-7"
                                                onClick={() => addRuleFromPattern(p.pattern)}
                                                size="icon"
                                                title="Add rule"
                                                type="button"
                                                variant="ghost"
                                            >
                                                <PlusIcon className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                        <td className="px-2 py-1">
                                            <DialogTriggerButton
                                                className="h-auto max-w-[44ch] justify-start p-0 text-left font-mono text-[11px] leading-tight"
                                                renderContent={() => <ExamplesDialogContent pattern={p} />}
                                                type="button"
                                                variant="link"
                                            >
                                                <span className="truncate" title={p.pattern}>
                                                    {p.pattern}
                                                </span>
                                            </DialogTriggerButton>
                                        </td>
                                        <td className="px-2 py-1 text-right tabular-nums">{p.count}</td>
                                        <td className="px-2 py-1 text-right text-muted-foreground" dir="rtl">
                                            <DialogTriggerButton
                                                className="h-auto max-w-[64ch] justify-end p-0 text-[11px] leading-tight"
                                                renderContent={() => <ExamplesDialogContent pattern={p} />}
                                                type="button"
                                                variant="link"
                                            >
                                                <span
                                                    className="block overflow-hidden text-ellipsis whitespace-nowrap text-right"
                                                    title={example}
                                                >
                                                    {example}
                                                </span>
                                            </DialogTriggerButton>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </ScrollArea>
        </div>
    );
};
