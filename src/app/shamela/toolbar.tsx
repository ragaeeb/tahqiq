import {
    DownloadIcon,
    EraserIcon,
    FileTextIcon,
    FootprintsIcon,
    RefreshCwIcon,
    SaveIcon,
    SplitIcon,
} from 'lucide-react';
import { record } from 'nanolytics';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmButton } from '@/components/confirm-button';
import { useStorageActions } from '@/components/hooks/use-storage-actions';
import { SegmentationPanel } from '@/components/segmentation/SegmentationPanel';
import { Button } from '@/components/ui/button';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { STORAGE_KEYS } from '@/lib/constants';
import { usePatchStore } from '@/stores/patchStore';
import { selectAllPages } from '@/stores/shamelaStore/selectors';
import type { ShamelaBook } from '@/stores/shamelaStore/types';
import { useShamelaStore } from '@/stores/shamelaStore/useShamelaStore';
import { PatchesDialogContent } from './patches-dialog';

export const Toolbar = () => {
    const patchCount = usePatchStore((state) => state.patches.length);
    const pages = useShamelaStore(selectAllPages);
    const removePageMarkers = useShamelaStore((state) => state.removePageMarkers);
    const removeFootnoteReferences = useShamelaStore((state) => state.removeFootnoteReferences);
    const reset = useShamelaStore((state) => state.reset);
    const [isSegmentationPanelOpen, setIsSegmentationPanelOpen] = useState(false);

    // Transform shamela pages to flappa-doormal Page format
    const formattedPages = useMemo(
        () => pages.map((p) => ({ content: p.footnote ? `${p.body}_________${p.footnote}` : p.body, id: p.id })),
        [pages],
    );

    /**
     * Creates a ShamelaBook object from the current store state.
     * Shared between save and download handlers to avoid duplication.
     */
    const getExportData = useCallback((): ShamelaBook => {
        const state = useShamelaStore.getState();
        return {
            majorRelease: state.majorRelease,
            pages: state.pages.map((p) => ({
                content: p.footnote ? `${p.body}_________${p.footnote}` : p.body,
                id: p.id,
                number: p.number,
                page: p.page,
                part: p.part,
            })),
            shamelaId: state.shamelaId,
            titles: state.titles.map((t) => ({ content: t.content, id: t.id, page: t.page, parent: t.parent })),
        };
    }, []);

    const { handleSave, handleDownload, handleReset } = useStorageActions({
        analytics: { download: 'DownloadShamela', reset: 'ResetShamela', save: 'SaveShamela' },
        getExportData,
        reset,
        storageKey: STORAGE_KEYS.shamela,
    });

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
                <SegmentationPanel onClose={() => setIsSegmentationPanelOpen(false)} pages={formattedPages} />
            )}
            {patchCount > 0 && (
                <DialogTriggerButton
                    onClick={() => record('OpenPatchesDialog')}
                    renderContent={() => <PatchesDialogContent />}
                    title="View tracked patches"
                    variant="outline"
                >
                    <FileTextIcon />
                    <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-orange-700 text-xs">
                        {patchCount}
                    </span>
                </DialogTriggerButton>
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
