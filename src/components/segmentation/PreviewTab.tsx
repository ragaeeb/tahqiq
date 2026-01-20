'use client';

import type { Page } from 'flappa-doormal';
import { ChevronDown, ChevronUp, Eye, Scissors, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import VirtualizedList from '@/app/excerpts/virtualized-list';
import SubmittableInput from '@/components/submittable-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    buildSegmentFilterOptions,
    type DebugMeta,
    getMetaKey,
    mapPagesToExcerpts,
    summarizeRulePattern,
} from '@/lib/segmentation';
import type { IndexedExcerpt } from '@/stores/excerptsStore/types';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type PreviewTabProps = { pages: Page[] };

const pagesLabel = (seg: IndexedExcerpt) => (seg.to ? `${seg.from}-${seg.to}` : String(seg.from));

const PreviewRow = ({
    seg,
    index,
    metaKey,
    options,
    filterKey,
    setFilterKey,
    setJumpToPage,
    expandedIds,
    toggleExpand,
}: {
    seg: IndexedExcerpt;
    index: number;
    metaKey: string;
    options: any;
    filterKey: string;
    setFilterKey: (v: string) => void;
    setJumpToPage: (v: string | null) => void;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
}) => {
    const dbg = (seg.meta as any)?.[metaKey] as DebugMeta | undefined;
    const referencedRule = dbg?.rule ? options.rules?.[dbg.rule.index] : undefined;
    const ruleText =
        dbg?.rule && referencedRule
            ? `${dbg.rule.patternType}: ${summarizeRulePattern(referencedRule)}`
            : dbg?.rule
              ? `${dbg.rule.index}:${dbg.rule.patternType}`
              : '';

    const bpPattern = dbg?.breakpoint?.pattern;
    const bpText = typeof bpPattern === 'string' ? (bpPattern === '' ? '<page-boundary>' : bpPattern) : '';
    const contentSplit = dbg?.contentLengthSplit;

    const renderRuleBadge = () => {
        if (!ruleText) {
            return <span className="text-muted-foreground text-xs">—</span>;
        }
        return (
            <Badge
                className="max-w-full justify-start truncate font-mono text-[11px] leading-tight"
                title={ruleText}
                variant="outline"
            >
                {ruleText}
            </Badge>
        );
    };

    const renderBreakpointBadges = () => {
        if (!bpText && !contentSplit) {
            return <span className="text-muted-foreground text-xs">—</span>;
        }
        return (
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
                        <span className="text-destructive-foreground/70">({contentSplit.splitReason})</span>
                    </Badge>
                )}
            </div>
        );
    };

    return (
        <tr className="border-b" key={`${seg.from}-${seg.to ?? seg.from}-${index}`}>
            <td className="group w-24 px-2 py-2 text-muted-foreground text-xs tabular-nums">
                <div className="flex items-center justify-between">
                    <span>{pagesLabel(seg)}</span>
                    {filterKey !== 'all' && (
                        <Button
                            className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => {
                                setFilterKey('all');
                                setJumpToPage(String(seg.from));
                            }}
                            size="icon"
                            title="Show in context"
                            variant="ghost"
                        >
                            <Eye className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </td>
            <td className="w-64 px-2 py-2 align-top">{renderRuleBadge()}</td>
            <td className="w-56 px-2 py-2 align-top">{renderBreakpointBadges()}</td>
            <td className="relative px-2 py-2 text-right" dir="rtl">
                <div className="flex gap-2">
                    <div
                        className={`${expandedIds.has(seg.id) ? '' : 'line-clamp-3'} flex-1 whitespace-pre-wrap break-words font-arabic text-xs leading-relaxed`}
                    >
                        {seg.nass}
                    </div>
                    <Button
                        className="h-6 w-6 shrink-0 rounded-full"
                        onClick={() => toggleExpand(seg.id)}
                        size="icon"
                        variant="ghost"
                    >
                        {expandedIds.has(seg.id) ? (
                            <ChevronUp className="h-3 w-3" />
                        ) : (
                            <ChevronDown className="h-3 w-3" />
                        )}
                    </Button>
                </div>
            </td>
        </tr>
    );
};

export const PreviewTab = ({ pages }: PreviewTabProps) => {
    const options = useSegmentationStore((s) => s.options);
    const debug = (options as any).debug && typeof (options as any).debug === 'object' ? (options as any).debug : true;
    const metaKey = getMetaKey(debug);
    const [filterKey, setFilterKey] = useState<string>('all');
    const [jumpToPage, setJumpToPage] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const segments = useMemo(() => {
        const result = mapPagesToExcerpts(pages, [], { ...(options as any), debug });
        return result.excerpts;
    }, [pages, options, debug]);

    const { filteredSegments, filterOptions } = useMemo(() => {
        return buildSegmentFilterOptions(segments, metaKey, filterKey);
    }, [segments, metaKey, filterKey]);

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                    {filteredSegments.length !== segments.length
                        ? `${filteredSegments.length.toLocaleString()} of ${segments.length.toLocaleString()}`
                        : `${segments.length.toLocaleString()} segments`}
                </span>
            </div>

            <div className="min-h-0 flex-1 rounded-md border">
                <VirtualizedList
                    data={filteredSegments}
                    estimateSize={() => 120}
                    getKey={(seg, i) => `${seg.from}-${seg.to ?? seg.from}-${i}`}
                    scrollToId={jumpToPage ? Number.parseInt(jumpToPage, 10) : null}
                    onScrollToComplete={() => setJumpToPage(null)}
                    findScrollIndex={(data, pageNum) => {
                        const target = typeof pageNum === 'string' ? Number.parseInt(pageNum, 10) : pageNum;
                        if (typeof target !== 'number' || Number.isNaN(target)) {
                            return -1;
                        }
                        return data.findIndex((seg) => {
                            const start = seg.from;
                            const end = seg.to ?? seg.from;
                            return target >= start && target <= end;
                        });
                    }}
                    header={
                        <tr>
                            <th className="w-24 px-2 py-2 text-left font-medium">
                                <div className="relative">
                                    <SubmittableInput
                                        name="page-filter"
                                        placeholder="Pages"
                                        className="h-7 w-20 px-2 text-xs"
                                        onSubmit={(val) => setJumpToPage(val || null)}
                                        type="number"
                                        min={1}
                                        dir="ltr"
                                    />
                                    {!jumpToPage && (
                                        <Search className="pointer-events-none absolute top-1.5 right-2 h-3 w-3 text-muted-foreground opacity-50" />
                                    )}
                                </div>
                            </th>
                            <th className="w-64 px-2 py-2 text-left font-medium">Rule</th>
                            <th className="w-56 px-2 py-2 text-left font-medium">Breakpoint</th>
                            <th className="px-2 py-2 text-right font-medium" dir="rtl">
                                Content
                            </th>
                        </tr>
                    }
                    height="100%"
                    renderRow={(seg, i) => (
                        <PreviewRow
                            seg={seg}
                            index={i}
                            metaKey={metaKey}
                            options={options}
                            filterKey={filterKey}
                            setFilterKey={setFilterKey}
                            setJumpToPage={setJumpToPage}
                            expandedIds={expandedIds}
                            toggleExpand={toggleExpand}
                        />
                    )}
                />
            </div>
        </div>
    );
};
