import { DownloadIcon, FootprintsIcon, SaveIcon, SplitIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useStorageActions } from '@/components/hooks/use-storage-actions';
import { ResetButton } from '@/components/reset-button';
import { SegmentationPanel } from '@/components/segmentation/SegmentationPanel';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS } from '@/lib/constants';
import { selectAllPages, selectAllTitles } from '@/stores/webStore/selectors';
import type { ScrapeResult } from '@/stores/webStore/types';
import { useWebStore } from '@/stores/webStore/useWebStore';

export const Toolbar = () => {
    const searchParams = useSearchParams();
    const bookId = searchParams.get('book') || undefined;
    const removeFootnotes = useWebStore((state) => state.removeFootnotes);
    const reset = useWebStore((state) => state.reset);
    const [isSegmentationPanelOpen, setIsSegmentationPanelOpen] = useState(false);
    const pages = useWebStore(selectAllPages);
    const titles = useWebStore(selectAllTitles);

    const getExportData = useCallback(() => {
        const {
            contractVersion,
            urlPattern,
            lastUpdatedAt,
            createdAt,
            pages,
            type,
            scrapingEngine,
            postProcessingApps,
        } = useWebStore.getState();

        return {
            contractVersion,
            createdAt,
            lastUpdatedAt,
            pages,
            postProcessingApps,
            scrapingEngine,
            type,
            urlPattern,
        } satisfies ScrapeResult;
    }, []);

    const { handleSave, handleDownload, handleReset, handleResetAll } = useStorageActions({
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

    const segmentationPages = useMemo(() => {
        return pages.map(({ id, content }) => ({ content, id }));
    }, [pages]);

    return (
        <div className="space-x-2">
            <Button onClick={handleRemoveFootnotes} title="Remove footnotes from all pages" variant="outline">
                <FootprintsIcon />
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
                    bookId={bookId}
                    onClose={() => setIsSegmentationPanelOpen(false)}
                    pages={segmentationPages}
                    headings={titles}
                />
            )}
            <Button className="bg-emerald-500" onClick={handleSave}>
                <SaveIcon />
            </Button>
            <Button onClick={handleDownload}>
                <DownloadIcon />
            </Button>
            <ResetButton onReset={handleReset} onResetAll={handleResetAll} />
        </div>
    );
};
