import { getSegmentDebugReason, type Page } from 'flappa-doormal';
import { ChevronDown, ChevronUp, Eye, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import VirtualizedList from '@/app/excerpts/virtualized-list';
import SubmittableInput from '@/components/submittable-input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildSegmentFilterOptions, getMetaKey, mapPagesToExcerpts } from '@/lib/segmentation';
import type { IndexedExcerpt } from '@/stores/excerptsStore/types';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type PreviewTabProps = { pages: Page[] };

const pagesLabel = (seg: IndexedExcerpt) => (seg.to ? `${seg.from}-${seg.to}` : String(seg.from));

const PreviewRow = ({
    seg,
    index,
    filterKey,
    setFilterKey,
    setJumpToPage,
    expandedIds,
    toggleExpand,
}: {
    seg: IndexedExcerpt;
    index: number;
    filterKey: string;
    setFilterKey: (v: string) => void;
    setJumpToPage: (v: string | null) => void;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
}) => {
    const debugReason = getSegmentDebugReason({ ...seg, content: seg.nass } as any, { concise: true });

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
            <td className="w-[300px] px-2 py-2 align-top font-mono text-[10px] text-blue-600 leading-tight">
                {debugReason || <span className="text-[10px] text-muted-foreground">—</span>}
            </td>
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

        if (!result.report.ok) {
            toast.warning(`${result.report.issues.length} issues found: ${result.report.summary}`);
        }

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
                            <th className="w-[300px] px-2 py-2 text-left font-medium">Debug Reason</th>
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
