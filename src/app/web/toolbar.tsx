import type { Page } from 'flappa-doormal';
import { DownloadIcon, EraserIcon, FootprintsIcon, RefreshCwIcon, SaveIcon, SplitIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmButton } from '@/components/confirm-button';
import { useStorageActions } from '@/components/hooks/use-storage-actions';
import { SegmentationPanel } from '@/components/segmentation/SegmentationPanel';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS } from '@/lib/constants';
import { stripTatweelSafe } from '@/lib/textUtils';
import { webSegmentsToExcerpts } from '@/lib/transform/web-excerpts';
import type { WebBook } from '@/stores/webStore/types';
import { useWebStore } from '@/stores/webStore/useWebStore';

export const Toolbar = ({ segmentationPages }: { segmentationPages: Page[] }) => {
    const removeFootnotes = useWebStore((state) => state.removeFootnotes);
    const applyBodyFormatting = useWebStore((state) => state.applyBodyFormatting);
    const reset = useWebStore((state) => state.reset);
    const [isSegmentationPanelOpen, setIsSegmentationPanelOpen] = useState(false);

    /**
     * Creates a WebBook object from the current store state.
     * Shared between save and download handlers to avoid duplication.
     */
    const getExportData = useCallback((): Partial<WebBook> => {
        const state = useWebStore.getState();
        return {
            pages: state.pages.map((p) => ({
                ...(p.accessed && { accessed: p.accessed }),
                body: p.body,
                ...(p.footnote && { footnote: p.footnote }),
                page: p.id,
                ...(p.pageTitle && { title: p.pageTitle }),
                ...(p.url && { url: p.url }),
            })),
            ...(state.scrapingEngine && { scrapingEngine: state.scrapingEngine }),
            timestamp: new Date().toISOString(),
            ...(state.urlPattern && { urlPattern: state.urlPattern }),
        };
    }, []);

    const { handleSave, handleDownload, handleReset } = useStorageActions({
        analytics: { download: 'DownloadWeb', reset: 'ResetWeb', save: 'SaveWeb' },
        getExportData,
        reset,
        storageKey: STORAGE_KEYS.web,
    });

    const handleRemoveFootnotes = useCallback(() => {
        record('RemoveWebFootnotes');
        removeFootnotes();
        toast.success('Removed footnotes from all pages');
    }, [removeFootnotes]);

    return (
        <div className="space-x-2">
            <Button onClick={handleRemoveFootnotes} title="Remove footnotes from all pages" variant="outline">
                <FootprintsIcon />
            </Button>
            <Button
                onClick={() => {
                    record('StripWebTatweel');
                    applyBodyFormatting(stripTatweelSafe);
                    toast.success('Removed Tatweel from all pages');
                }}
                title="Remove Tatweel (kashida) from all page bodies"
                variant="outline"
            >
                <EraserIcon />
            </Button>
            <Button
                onClick={() => {
                    record('OpenWebSegmentationPanel');
                    setIsSegmentationPanelOpen(true);
                }}
                title="Segment pages"
                variant="outline"
            >
                <SplitIcon />
            </Button>
            {isSegmentationPanelOpen && (
                <SegmentationPanel
                    onClose={() => setIsSegmentationPanelOpen(false)}
                    onCreateExcerpts={(segments, options) => {
                        const state = useWebStore.getState();
                        return webSegmentsToExcerpts(state.pages, state.titles, segments, options);
                    }}
                    pages={segmentationPages}
                />
            )}
            <Button className="bg-emerald-500" onClick={handleSave}>
                <SaveIcon />
            </Button>
            <Button onClick={handleDownload}>
                <DownloadIcon />
            </Button>
            <ConfirmButton onClick={handleReset}>
                <RefreshCwIcon />
            </ConfirmButton>
        </div>
    );
};
