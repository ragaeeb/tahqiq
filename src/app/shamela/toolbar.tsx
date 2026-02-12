import { DownloadIcon, EraserIcon, FootprintsIcon, SaveIcon, SplitIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useStorageActions } from '@/components/hooks/use-storage-actions';
import { ResetButton } from '@/components/reset-button';
import { SegmentationPanel } from '@/components/segmentation/SegmentationPanel';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS } from '@/lib/constants';
import { selectAllPages, selectAllTitles } from '@/stores/shamelaStore/selectors';
import type { ShamelaBook } from '@/stores/shamelaStore/types';
import { useShamelaStore } from '@/stores/shamelaStore/useShamelaStore';

export const Toolbar = () => {
    const allPages = useShamelaStore(selectAllPages);
    const titles = useShamelaStore(selectAllTitles);
    const removePageMarkers = useShamelaStore((state) => state.removePageMarkers);
    const removeFootnoteReferences = useShamelaStore((state) => state.removeFootnoteReferences);
    const reset = useShamelaStore((state) => state.reset);
    const [isSegmentationPanelOpen, setIsSegmentationPanelOpen] = useState(false);

    // Transform shamela pages to flappa-doormal Page format
    const pages = useMemo(() => allPages.map((p) => ({ content: p.body, id: p.id })), [allPages]);

    /**
     * Creates a ShamelaBook object from the current store state.
     * Shared between save and download handlers to avoid duplication.
     */
    const getExportData = useCallback((): ShamelaBook => {
        const state = useShamelaStore.getState();
        return {
            id: state.shamelaId!,
            pages: state.pages.map((p) => ({
                content: p.footnote ? `${p.body}_________${p.footnote}` : p.body,
                id: p.id,
                number: p.number,
                page: p.page,
                part: p.part,
            })),
            titles: state.titles.map((t) => ({ content: t.content, id: t.id, page: t.page, parent: t.parent })),
            version: state.version,
        } as any;
    }, []);

    const { handleDownload, handleReset, handleResetAll } = useStorageActions({
        analytics: { download: 'DownloadShamela', reset: 'ResetShamela', save: 'SaveShamela' },
        getExportData,
        reset,
        storageKey: STORAGE_KEYS.shamela,
    });

    const handleSave = useCallback(async () => {
        record('SaveShamela');
        const success = await useShamelaStore.getState().save();
        if (success) {
            toast.success('Saved shamela book');
        } else {
            console.error('Save failed, falling back to download');
            const data = getExportData();
            const name = `${STORAGE_KEYS.shamela}-${Date.now()}.json`;
            const { downloadFile } = await import('@/lib/domUtils');
            downloadFile(name, JSON.stringify(data, null, 2));
        }
    }, [getExportData]);

    const handleRemovePageMarkers = useCallback(() => {
        record('RemovePageMarkers');
        removePageMarkers();
        toast.success('Removed Arabic page markers from all pages');
    }, [removePageMarkers]);

    const handleRemoveFootnoteReferences = useCallback(() => {
        record('RemoveFootnoteReferences');
        removeFootnoteReferences();
        toast.success('Removed footnote references and cleared footnotes from all pages');
    }, [removeFootnoteReferences]);

    return (
        <div className="space-x-2">
            <Button onClick={handleRemovePageMarkers} title="Remove page markers" variant="outline">
                <EraserIcon />
            </Button>
            <Button
                onClick={handleRemoveFootnoteReferences}
                title="Remove footnote references and clear footnotes"
                variant="outline"
            >
                <FootprintsIcon />
            </Button>
            <Button
                onClick={() => {
                    record('OpenSegmentationPanel');
                    setIsSegmentationPanelOpen(true);
                }}
                title="Segment pages"
                variant="outline"
            >
                <SplitIcon />
            </Button>
            {isSegmentationPanelOpen && (
                <SegmentationPanel onClose={() => setIsSegmentationPanelOpen(false)} pages={pages} headings={titles} />
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
