'use client';

import type { Page, SegmentValidationIssue, SegmentValidationReport } from 'flappa-doormal';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useMemo } from 'react';
import VirtualizedList from '@/app/excerpts/virtualized-list';
import { Badge } from '@/components/ui/badge';
import { mapPagesToExcerpts } from '@/lib/segmentation';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type ErrorsTabProps = { pages: Page[] };

const getSeverityStyles = (severity: SegmentValidationIssue['severity']) => {
    if (severity === 'error') {
        return { badge: 'bg-red-100 text-red-700 border-red-300', icon: <XCircle className="h-4 w-4 text-red-500" /> };
    }
    return {
        badge: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    };
};

const getTypeLabel = (type: SegmentValidationIssue['type']) => {
    switch (type) {
        case 'max_pages_violation':
            return 'Max Pages Exceeded';
        case 'page_attribution_mismatch':
            return 'Page Attribution Mismatch';
        case 'content_not_found':
            return 'Content Not Found';
        case 'page_not_found':
            return 'Page Not Found';
        default:
            return type;
    }
};

const ErrorRow = ({ issue, index }: { issue: SegmentValidationIssue; index: number }) => {
    const styles = getSeverityStyles(issue.severity);

    return (
        <tr className="border-b" key={`${issue.segmentIndex}-${index}`}>
            <td className="w-16 px-2 py-2 text-center">{styles.icon}</td>
            <td className="w-24 px-2 py-2 text-muted-foreground text-xs tabular-nums">#{issue.segmentIndex}</td>
            <td className="w-48 px-2 py-2">
                <Badge className={`${styles.badge} font-mono text-[11px]`} variant="outline">
                    {getTypeLabel(issue.type)}
                </Badge>
            </td>
            <td className="w-32 px-2 py-2 text-muted-foreground text-xs">
                {issue.segment.from}
                {issue.segment.to && issue.segment.to !== issue.segment.from ? `–${issue.segment.to}` : ''}
            </td>
            <td className="px-2 py-2" dir="rtl">
                <div className="line-clamp-2 font-arabic text-xs leading-relaxed">{issue.segment.contentPreview}</div>
            </td>
            <td className="w-64 px-2 py-2 text-left text-muted-foreground text-xs">{issue.evidence || '—'}</td>
        </tr>
    );
};

export const ErrorsTab = ({ pages }: ErrorsTabProps) => {
    const options = useSegmentationStore((s) => s.options);

    const now = performance.now();
    console.log('running memo');
    const report: SegmentValidationReport = useMemo(() => {
        const result = mapPagesToExcerpts(pages, [], options);
        return result.report;
    }, [pages, options]);
    console.log('finished', performance.now() - now);

    const { issues } = report;
    const errorCount = report.summary.errors;
    const warningCount = report.summary.warnings;

    if (report.ok && issues.length === 0) {
        return (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 py-8">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <div className="text-center">
                    <h3 className="font-medium text-gray-900 text-lg">No Errors Found</h3>
                    <p className="text-muted-foreground text-sm">
                        All {report.summary.segmentCount} segments validated successfully against{' '}
                        {report.summary.pageCount} pages.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {errorCount > 0 && (
                        <span className="flex items-center gap-1 text-red-600 text-sm">
                            <XCircle className="h-4 w-4" />
                            {errorCount} error{errorCount !== 1 ? 's' : ''}
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="flex items-center gap-1 text-sm text-yellow-600">
                            <AlertTriangle className="h-4 w-4" />
                            {warningCount} warning{warningCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <span className="text-muted-foreground text-xs">
                    {report.summary.segmentCount} segments • {report.summary.pageCount} pages
                </span>
            </div>

            <div className="min-h-0 flex-1 rounded-md border">
                <VirtualizedList
                    data={issues}
                    estimateSize={() => 60}
                    getKey={(issue, i) => `${issue.segmentIndex}-${i}`}
                    header={
                        <tr>
                            <th className="w-16 px-2 py-2 text-center font-medium" />
                            <th className="w-24 px-2 py-2 text-left font-medium">Segment</th>
                            <th className="w-48 px-2 py-2 text-left font-medium">Issue Type</th>
                            <th className="w-32 px-2 py-2 text-left font-medium">Pages</th>
                            <th className="px-2 py-2 text-right font-medium" dir="rtl">
                                Content Preview
                            </th>
                            <th className="w-64 px-2 py-2 text-left font-medium">Evidence</th>
                        </tr>
                    }
                    height="100%"
                    renderRow={(issue, i) => <ErrorRow issue={issue} index={i} />}
                />
            </div>
        </div>
    );
};
