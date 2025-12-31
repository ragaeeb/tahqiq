'use client';

import { type Page, type Segment, segmentPages } from 'flappa-doormal';
import { useMemo } from 'react';
import VirtualizedList from '@/app/excerpts/virtualized-list';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type PreviewTabProps = { pages: Page[] };

const getMetaKey = (debug: unknown): string => {
    if (debug && typeof debug === 'object' && typeof (debug as any).metaKey === 'string') {
        return (debug as any).metaKey;
    }
    return '_flappa';
};

const pagesLabel = (seg: Segment) => (seg.to ? `${seg.from}-${seg.to}` : String(seg.from));

const summarizeRulePattern = (rule: any) => {
    if (!rule || typeof rule !== 'object') {
        return '';
    }
    if (Array.isArray(rule.lineStartsWith)) {
        return rule.lineStartsWith.length > 1
            ? `${rule.lineStartsWith[0]} (+${rule.lineStartsWith.length - 1})`
            : (rule.lineStartsWith[0] ?? '');
    }
    if (Array.isArray(rule.lineStartsAfter)) {
        return rule.lineStartsAfter.length > 1
            ? `${rule.lineStartsAfter[0]} (+${rule.lineStartsAfter.length - 1})`
            : (rule.lineStartsAfter[0] ?? '');
    }
    if (Array.isArray(rule.lineEndsWith)) {
        return rule.lineEndsWith.length > 1
            ? `${rule.lineEndsWith[0]} (+${rule.lineEndsWith.length - 1})`
            : (rule.lineEndsWith[0] ?? '');
    }
    if (typeof rule.template === 'string') {
        return rule.template;
    }
    if (typeof rule.regex === 'string') {
        return rule.regex;
    }
    return '';
};

export const PreviewTab = ({ pages }: PreviewTabProps) => {
    const options = useSegmentationStore((s) => s.options);
    const debug = (options as any).debug && typeof (options as any).debug === 'object' ? (options as any).debug : true;
    const metaKey = getMetaKey(debug);

    const segments = useMemo(() => {
        // Always enable debug for preview; do not mutate store options.
        return segmentPages(pages, { ...(options as any), debug });
    }, [pages, options, debug]);

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-3">
            <div className="flex items-center justify-between">
                <Label>Preview</Label>
                <span className="text-muted-foreground text-xs">{segments.length.toLocaleString()} segments</span>
            </div>

            <div className="min-h-0 flex-1 rounded-md border">
                <VirtualizedList
                    data={segments}
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
                        const dbg = (seg.meta as any)?.[metaKey] as any;
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
                                    {bpText ? (
                                        <Badge
                                            className="max-w-full justify-start truncate font-mono text-[10px] leading-tight"
                                            title={bpText}
                                            variant="secondary"
                                        >
                                            {bpText}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">—</span>
                                    )}
                                </td>
                                <td className="px-2 py-2 text-right" dir="rtl">
                                    <div className="line-clamp-3 whitespace-pre-wrap break-words font-arabic text-xs leading-relaxed">
                                        {seg.content}
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
