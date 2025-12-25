'use client';

import { type Page, type Segment, type SegmentationOptions, segmentPages } from 'flappa-doormal';
import { useCallback, useMemo, useState } from 'react';
import { convertContentToMarkdown } from 'shamela';
import VirtualizedList from '@/app/excerpts/virtualized-list';
import SubmittableInput from '@/components/submittable-input';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';
import { useShamelaStore } from '@/stores/shamelaStore/useShamelaStore';
import { buildGeneratedOptions } from './JsonTab';

/**
 * Preview tab showing segmentation results with virtualization for performance.
 * Includes a page filter to quickly jump to segments by page number.
 */
export const PreviewTab = () => {
    const { ruleConfigs, sliceAtPunctuation, tokenMappings } = useSegmentationStore();
    const pages = useShamelaStore((state) => state.pages);

    // State for scrolling to a specific page
    const [scrollToPage, setScrollToPage] = useState<number | null>(null);

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

            const result = segmentPages(segmentationPages, options);
            return { error: null, segments: result };
        } catch (err) {
            return { error: err instanceof Error ? err.message : 'Unknown error', segments: [] };
        }
    }, [ruleConfigs, sliceAtPunctuation, tokenMappings, pages]);

    // Find segment index by page number (from or to)
    const findScrollIndex = useCallback((data: Segment[], pageNum: number | string) => {
        const targetPage = typeof pageNum === 'string' ? parseInt(pageNum, 10) : pageNum;
        if (Number.isNaN(targetPage)) {
            return -1;
        }

        // Find first segment where from <= targetPage <= to (or from === targetPage if no to)
        return data.findIndex((segment) => {
            const from = segment.from;
            const to = segment.to ?? from;
            return targetPage >= from && targetPage <= to;
        });
    }, []);

    // Clear scroll target after scrolling completes
    const handleScrollComplete = useCallback(() => {
        setScrollToPage(null);
    }, []);

    // Handle page filter submission
    const handlePageFilter = useCallback((value: string) => {
        const pageNum = parseInt(value, 10);
        if (!Number.isNaN(pageNum)) {
            setScrollToPage(pageNum);
        }
    }, []);

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
                findScrollIndex={findScrollIndex}
                getKey={(item, index) => `${item.from}-${index}`}
                header={<PreviewHeader onPageFilter={handlePageFilter} segmentCount={segments.length} />}
                onScrollToComplete={handleScrollComplete}
                renderRow={(item, index) => <PreviewRow index={index} segment={item} />}
                scrollToId={scrollToPage}
            />
        </div>
    );
};

type PreviewHeaderProps = { onPageFilter: (value: string) => void; segmentCount: number };

const PreviewHeader = ({ onPageFilter }: PreviewHeaderProps) => (
    <tr className="bg-muted/50 text-xs">
        <th className="w-16 px-2 py-1.5 text-left font-medium">
            <SubmittableInput
                className="w-full border-none bg-transparent px-0 py-0 text-left text-gray-800 text-xs outline-none transition-colors duration-150 placeholder:text-muted-foreground focus:rounded focus:bg-gray-50"
                name="page-filter"
                onSubmit={onPageFilter}
                placeholder="Page"
            />
        </th>
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
