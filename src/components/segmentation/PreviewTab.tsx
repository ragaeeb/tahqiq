'use client';

import type { Page } from 'flappa-doormal';
import { Scissors } from 'lucide-react';
import { useMemo, useState } from 'react';
import VirtualizedList from '@/app/excerpts/virtualized-list';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    type DebugMeta,
    getMetaKey,
    getSegmentFilterKey,
    mapPagesToExcerpts,
    summarizeRulePattern,
} from '@/lib/segmentation';
import type { IndexedExcerpt } from '@/stores/excerptsStore/types';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type PreviewTabProps = { pages: Page[] };

type FilterOption = {
    type: 'all' | 'rule-only' | 'breakpoint' | 'contentLengthSplit';
    value?: string; // For breakpoint patterns or splitReason
    label: string;
    count: number;
};

const pagesLabel = (seg: IndexedExcerpt) => (seg.to ? `${seg.from}-${seg.to}` : String(seg.from));

export const PreviewTab = ({ pages }: PreviewTabProps) => {
    const options = useSegmentationStore((s) => s.options);
    const debug = (options as any).debug && typeof (options as any).debug === 'object' ? (options as any).debug : true;
    const metaKey = getMetaKey(debug);
    const [filterKey, setFilterKey] = useState<string>('all');

    const segments = useMemo(() => {
        const result = mapPagesToExcerpts(pages, [], { ...(options as any), debug });
        return result.excerpts;
    }, [pages, options, debug]);

    const { filteredSegments, filterOptions } = useMemo(() => {
        const counts = new Map<string, number>();
        counts.set('all', segments.length);
        counts.set('rule-only', 0);

        // First pass: count occurrences of each filter key
        for (const seg of segments) {
            const dbg = (seg.meta as any)?.[metaKey] as DebugMeta | undefined;
            const key = getSegmentFilterKey(dbg);
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }

        // Build filter options
        const opts: FilterOption[] = [{ count: counts.get('all') ?? 0, label: 'All segments', type: 'all' }];

        const ruleOnlyCount = counts.get('rule-only') ?? 0;
        if (ruleOnlyCount > 0) {
            opts.push({ count: ruleOnlyCount, label: 'Rule matches only', type: 'rule-only' });
        }

        // Add breakpoint patterns
        for (const [key, count] of counts) {
            if (key.startsWith('breakpoint:')) {
                const pattern = key.slice('breakpoint:'.length);
                const displayPattern = pattern === '' ? '<page-boundary>' : pattern;
                opts.push({ count, label: `Breakpoint: ${displayPattern}`, type: 'breakpoint', value: pattern });
            }
        }

        // Add contentLengthSplit reasons
        for (const [key, count] of counts) {
            if (key.startsWith('contentLengthSplit:')) {
                const reason = key.slice('contentLengthSplit:'.length);
                opts.push({ count, label: `Max length (${reason})`, type: 'contentLengthSplit', value: reason });
            }
        }

        // Filter segments based on selected filter
        let filtered: IndexedExcerpt[];
        if (filterKey === 'all') {
            filtered = segments;
        } else {
            filtered = segments.filter((seg) => {
                const dbg = (seg.meta as any)?.[metaKey] as DebugMeta | undefined;
                return getSegmentFilterKey(dbg) === filterKey;
            });
        }

        return { filteredSegments: filtered, filterOptions: opts };
    }, [segments, metaKey, filterKey]);

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Label>Preview</Label>
                    {filterOptions.length > 1 && (
                        <Select value={filterKey} onValueChange={setFilterKey}>
                            <SelectTrigger className="h-7 w-auto min-w-[180px] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {filterOptions.map((opt) => {
                                    const key =
                                        opt.type === 'all'
                                            ? 'all'
                                            : opt.type === 'rule-only'
                                              ? 'rule-only'
                                              : `${opt.type}:${opt.value}`;
                                    return (
                                        <SelectItem key={key} value={key} className="text-xs">
                                            {opt.label} ({opt.count.toLocaleString()})
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <span className="text-muted-foreground text-xs">
                    {filterKey !== 'all'
                        ? `${filteredSegments.length.toLocaleString()} of ${segments.length.toLocaleString()}`
                        : `${segments.length.toLocaleString()} segments`}
                </span>
            </div>

            <div className="min-h-0 flex-1 rounded-md border">
                <VirtualizedList
                    data={filteredSegments}
                    estimateSize={() => 120}
                    getKey={(seg, i) => `${seg.from}-${seg.to ?? seg.from}-${i}`}
                    header={
                        <tr>
                            <th className="w-20 px-2 py-2 text-left font-medium">Pages</th>
                            <th className="w-64 px-2 py-2 text-left font-medium">Rule</th>
                            <th className="w-56 px-2 py-2 text-left font-medium">Breakpoint</th>
                            <th className="px-2 py-2 text-right font-medium" dir="rtl">
                                Content
                            </th>
                        </tr>
                    }
                    height="100%"
                    renderRow={(seg, i) => {
                        const dbg = (seg.meta as any)?.[metaKey] as DebugMeta | undefined;
                        const referencedRule = dbg?.rule ? options.rules[dbg.rule.index] : undefined;
                        const ruleText =
                            dbg?.rule && referencedRule
                                ? `${dbg.rule.patternType}: ${summarizeRulePattern(referencedRule)}`
                                : dbg?.rule
                                  ? `${dbg.rule.index}:${dbg.rule.patternType}`
                                  : '';

                        const bpPattern = dbg?.breakpoint?.pattern;
                        const bpText =
                            typeof bpPattern === 'string' ? (bpPattern === '' ? '<page-boundary>' : bpPattern) : '';

                        const contentSplit = dbg?.contentLengthSplit;

                        return (
                            <tr className="border-b" key={`${seg.from}-${seg.to ?? seg.from}-${i}`}>
                                <td className="w-20 px-2 py-2 text-muted-foreground text-xs tabular-nums">
                                    {pagesLabel(seg)}
                                </td>
                                <td className="w-64 px-2 py-2 align-top">
                                    {ruleText ? (
                                        <Badge
                                            className="max-w-full justify-start truncate font-mono text-[11px] leading-tight"
                                            title={ruleText}
                                            variant="outline"
                                        >
                                            {ruleText}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">—</span>
                                    )}
                                </td>
                                <td className="w-56 px-2 py-2 align-top">
                                    <div className="flex flex-col gap-1">
                                        {bpText && (
                                            <Badge
                                                className="max-w-full justify-start truncate font-mono text-[10px] leading-tight"
                                                title={bpText}
                                                variant="secondary"
                                            >
                                                {bpText}
                                            </Badge>
                                        )}
                                        {contentSplit && (
                                            <Badge
                                                className="max-w-full justify-start gap-1 truncate font-mono text-[10px] leading-tight"
                                                title={`Safety split at ${contentSplit.maxContentLength} chars (${contentSplit.splitReason})`}
                                                variant="destructive"
                                            >
                                                <Scissors className="h-3 w-3" />
                                                <span>maxLength: {contentSplit.maxContentLength}</span>
                                                <span className="text-destructive-foreground/70">
                                                    ({contentSplit.splitReason})
                                                </span>
                                            </Badge>
                                        )}
                                        {!bpText && !contentSplit && (
                                            <span className="text-muted-foreground text-xs">—</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-2 py-2 text-right" dir="rtl">
                                    <div className="line-clamp-3 whitespace-pre-wrap break-words font-arabic text-xs leading-relaxed">
                                        {seg.nass}
                                    </div>
                                </td>
                            </tr>
                        );
                    }}
                />
            </div>
        </div>
    );
};
