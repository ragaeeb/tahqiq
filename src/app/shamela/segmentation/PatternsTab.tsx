'use client';

import type { CommonLineStartPattern } from 'flappa-doormal';
import { ArrowDownIcon, ArrowUpIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PatternChip } from '@/components/PatternChip';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
    SEGMENTATION_DEFAULT_MIN_COUNT,
    SEGMENTATION_DEFAULT_TOP_K,
    SEGMENTATION_SIMILARITY_THRESHOLD,
} from '@/lib/constants';
import { buildPatternTooltip, findSimilarPatterns } from '@/lib/segmentation';
import { COMMON_PATTERNS } from '@/stores/segmentationStore/types';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type AnalyzedRule = { template: string; patternType: string; fuzzy: boolean; metaType: string };

type PatternsTabProps = { detectedRules: AnalyzedRule[]; onRemoveDetectedRule: (index: number) => void };

/**
 * Patterns tab with sliders, pattern table, and selection management
 */
export const PatternsTab = ({ detectedRules, onRemoveDetectedRule }: PatternsTabProps) => {
    const { allLineStarts, selectedPatterns, togglePattern, addCommonPattern } = useSegmentationStore();

    // Local filter state
    const [topK, setTopK] = useState(SEGMENTATION_DEFAULT_TOP_K);
    const [minCount, setMinCount] = useState(SEGMENTATION_DEFAULT_MIN_COUNT);
    const [sortBy, setSortBy] = useState<'count' | 'pattern'>('pattern');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // Toggle sort column/direction
    const handleSort = (column: 'count' | 'pattern') => {
        if (sortBy === column) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortDir(column === 'count' ? 'desc' : 'asc');
        }
    };

    // Filter and sort patterns
    const filteredLineStarts = useMemo(() => {
        const filtered = allLineStarts.filter((p) => p.count >= minCount).slice(0, topK);
        return [...filtered].sort((a, b) => {
            const dir = sortDir === 'asc' ? 1 : -1;
            if (sortBy === 'count') {
                return (a.count - b.count) * dir;
            }
            return a.pattern.localeCompare(b.pattern) * dir;
        });
    }, [allLineStarts, topK, minCount, sortBy, sortDir]);

    // Set of patterns that appear in the filtered table
    const filteredPatternSet = useMemo(() => {
        return new Set(filteredLineStarts.map((p) => p.pattern));
    }, [filteredLineStarts]);

    // Find patterns similar to selected ones (potential typos)
    const similarPatterns = useMemo(() => {
        return findSimilarPatterns(selectedPatterns, allLineStarts, SEGMENTATION_SIMILARITY_THRESHOLD);
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
    // Include both patterns from analysis AND common patterns that were selected
    const selectedPatternObjects = useMemo(() => {
        const fromAnalysis = allLineStarts.filter((p) => selectedPatterns.has(p.pattern));
        const analysisPatternSet = new Set(fromAnalysis.map((p) => p.pattern));

        // Add common patterns that are selected but not in allLineStarts
        const fromCommon = COMMON_PATTERNS.filter(
            (c) => selectedPatterns.has(c.pattern) && !analysisPatternSet.has(c.pattern),
        ).map((c) => ({ count: 0, examples: [], pattern: c.pattern }));

        return [...fromAnalysis, ...fromCommon];
    }, [selectedPatterns, allLineStarts]);

    // Filter common patterns to only show unselected ones
    const unselectedCommonPatterns = useMemo(() => {
        return COMMON_PATTERNS.filter((c) => !selectedPatterns.has(c.pattern));
    }, [selectedPatterns]);

    return (
        <>
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
                    <div className="font-medium text-green-800">Rules from Selection ({detectedRules.length})</div>
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
                                    onClick={() => onRemoveDetectedRule(idx)}
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
            {(selectedPatterns.size > 0 || unselectedCommonPatterns.length > 0) && (
                <div className="mb-4 space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="font-medium text-blue-800">Selected Patterns ({selectedPatterns.size})</div>
                    {selectedPatterns.size > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {selectedPatternObjects.map((p) => (
                                <PatternChip
                                    colorScheme="blue"
                                    key={p.pattern}
                                    onAction={() => togglePattern(p.pattern)}
                                    pattern={p}
                                    showCount={false}
                                    tooltipBuilder={buildPatternTooltip}
                                />
                            ))}
                        </div>
                    )}

                    {/* Common Patterns */}
                    {unselectedCommonPatterns.length > 0 && (
                        <div className="mt-3 border-blue-200 border-t pt-2">
                            <div className="mb-1 text-purple-700 text-sm">Common Patterns:</div>
                            <div className="flex flex-wrap gap-1">
                                {unselectedCommonPatterns.map((c) => (
                                    <button
                                        className="rounded bg-purple-100 px-2 py-0.5 font-mono text-purple-800 text-xs hover:bg-purple-200"
                                        key={c.pattern}
                                        onClick={() => addCommonPattern(c)}
                                        title={`Add ${c.label} (${c.patternType}${c.fuzzy ? ', fuzzy' : ''}${c.metaType !== 'none' ? `, ${c.metaType}` : ''})`}
                                        type="button"
                                    >
                                        + {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Similar Patterns (Typos) */}
                    {similarPatterns.length > 0 && (
                        <div className="mt-3 border-blue-200 border-t pt-2">
                            {/* Hidden typos (not in table) - RED */}
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
                                                tooltipBuilder={buildPatternTooltip}
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

                            {/* Visible typos (in table) - AMBER */}
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
                                                tooltipBuilder={buildPatternTooltip}
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
                                <th className="px-2 py-1 text-left font-medium">
                                    <button
                                        className="flex items-center gap-1 hover:text-blue-600"
                                        onClick={() => handleSort('pattern')}
                                        type="button"
                                    >
                                        Pattern
                                        {sortBy === 'pattern' &&
                                            (sortDir === 'asc' ? (
                                                <ArrowUpIcon className="h-3 w-3" />
                                            ) : (
                                                <ArrowDownIcon className="h-3 w-3" />
                                            ))}
                                    </button>
                                </th>
                                <th className="w-16 px-2 py-1 text-right font-medium">
                                    <button
                                        className="flex items-center justify-end gap-1 hover:text-blue-600"
                                        onClick={() => handleSort('count')}
                                        type="button"
                                    >
                                        Count
                                        {sortBy === 'count' &&
                                            (sortDir === 'asc' ? (
                                                <ArrowUpIcon className="h-3 w-3" />
                                            ) : (
                                                <ArrowDownIcon className="h-3 w-3" />
                                            ))}
                                    </button>
                                </th>
                                <th className="px-2 py-1 text-right font-medium" dir="rtl">
                                    Example
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLineStarts.map((result) => {
                                const example = result.examples?.[0];
                                const isSelected = selectedPatterns.has(result.pattern);

                                const updateAddressWithPageId = () => {
                                    if (example.pageId) {
                                        window.location.hash = `#${example.pageId}`;
                                    }
                                };

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
                                                onClick={updateAddressWithPageId}
                                                type="button"
                                            >
                                                {result.pattern}
                                            </button>
                                        </td>
                                        <td className="px-2 py-1 text-right tabular-nums">{result.count}</td>
                                        <td className="px-2 py-1" dir="rtl">
                                            <button
                                                className="w-full max-w-40 truncate text-right text-muted-foreground hover:underline"
                                                onClick={updateAddressWithPageId}
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
        </>
    );
};
