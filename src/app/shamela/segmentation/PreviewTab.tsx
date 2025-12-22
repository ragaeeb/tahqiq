'use client';

import { type Page, type Segment, type SegmentationOptions, segmentPages } from 'flappa-doormal';
import { useMemo } from 'react';
import { convertContentToMarkdown } from 'shamela';
import VirtualizedList from '@/app/excerpts/virtualized-list';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';
import { useShamelaStore } from '@/stores/shamelaStore/useShamelaStore';
import { buildGeneratedOptions } from './JsonTab';

/**
 * Preview tab showing segmentation results with virtualization for performance
 */
export const PreviewTab = () => {
    const { ruleConfigs, sliceAtPunctuation, tokenMappings } = useSegmentationStore();
    const pages = useShamelaStore((state) => state.pages);

    // Generate segments preview
    const { segments, error } = useMemo(() => {
        if (ruleConfigs.length === 0) {
            return { error: null, segments: [] };
        }

        try {
            const optionsJson = buildGeneratedOptions(ruleConfigs, sliceAtPunctuation, tokenMappings);
            const options = JSON.parse(optionsJson) as SegmentationOptions;

            // Convert shamela pages to segmentation format
            const segmentationPages: Page[] = pages.map((p) => ({
                content: convertContentToMarkdown(p.body),
                id: p.id,
            }));

            console.log('options', options);
            const result = segmentPages(segmentationPages, options);
            console.log(
                'result',
                result.filter((r) => r.meta),
            );
            return { error: null, segments: result };
        } catch (err) {
            return { error: err instanceof Error ? err.message : 'Unknown error', segments: [] };
        }
    }, [ruleConfigs, sliceAtPunctuation, tokenMappings, pages]);

    if (error) {
        return <div className="flex h-full items-center justify-center text-red-500">Error: {error}</div>;
    }

    if (segments.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                No segments generated. Select patterns or rules first.
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-shrink-0 border-b bg-muted/30 px-3 py-1 text-muted-foreground text-xs">
                {segments.length.toLocaleString()} segments
            </div>
            <VirtualizedList
                data={segments}
                estimateSize={() => 80}
                getKey={(item, index) => `${item.from}-${index}`}
                header={<PreviewHeader />}
                renderRow={(item, index) => <PreviewRow index={index} segment={item} />}
            />
        </div>
    );
};

const PreviewHeader = () => (
    <tr className="bg-muted/50 text-xs">
        <th className="w-16 px-2 py-1.5 text-left font-medium">Pages</th>
        <th className="px-2 py-1.5 text-right font-medium" dir="rtl">
            Content
        </th>
        <th className="w-48 px-2 py-1.5 text-left font-medium">Meta</th>
    </tr>
);

const PreviewRow = ({ segment, index }: { segment: Segment; index: number }) => {
    // Format pages like excerpt-row: "from-to" or just "from"
    const pagesDisplay = [segment.from, segment.to].filter(Boolean).join('-');

    // Get meta type if exists
    const metaType = segment.meta?.type as string | undefined;

    // Row background based on meta type (like excerpt-row)
    const rowBg =
        metaType === 'chapter'
            ? 'bg-green-50'
            : metaType === 'book'
              ? 'bg-blue-50'
              : index % 2 === 0
                ? 'bg-white'
                : 'bg-muted/20';

    return (
        <tr className={`border-gray-100 border-b ${rowBg}`}>
            <td className="w-16 px-2 py-1.5 align-top text-gray-600 text-xs tabular-nums">{pagesDisplay}</td>
            <td className="px-2 py-1.5 text-right align-top" dir="rtl">
                <div className="line-clamp-3 whitespace-pre-wrap break-words font-arabic text-xs leading-relaxed">
                    {String(segment.content)}
                </div>
            </td>
            <td className="w-48 px-2 py-1.5 align-top font-mono text-[10px] text-muted-foreground">
                {(() => {
                    if (!segment.meta) {
                        return '—';
                    }
                    // Filter out 'content' if it exists in meta (shouldn't be there)
                    const { content, ...cleanMeta } = segment.meta as Record<string, unknown>;
                    return Object.keys(cleanMeta).length > 0 ? JSON.stringify(cleanMeta) : '—';
                })()}
            </td>
        </tr>
    );
};
