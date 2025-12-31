import type { Page } from 'flappa-doormal';
import { DownloadIcon, FileTextIcon, FootprintsIcon, RefreshCwIcon, SaveIcon, SplitIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmButton } from '@/components/confirm-button';
import { useStorageActions } from '@/components/hooks/use-storage-actions';
import { SegmentationPanel } from '@/components/segmentation/SegmentationPanel';
import { Button } from '@/components/ui/button';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { STORAGE_KEYS } from '@/lib/constants';
import { ketabSegmentsToExcerpts } from '@/lib/transform/ketab-excerpts';
import type { KetabBook } from '@/stores/ketabStore/types';
import { useKetabStore } from '@/stores/ketabStore/useKetabStore';
import { usePatchStore } from '@/stores/patchStore';
import { PatchesDialogContent } from './patches-dialog';

export const Toolbar = ({ segmentationPages }: { segmentationPages: Page[] }) => {
    const patchCount = usePatchStore((state) => state.patches.length);
    const removeFootnoteReferences = useKetabStore((state) => state.removeFootnoteReferences);
    const reset = useKetabStore((state) => state.reset);
    const [isSegmentationPanelOpen, setIsSegmentationPanelOpen] = useState(false);

    /**
     * Creates a KetabBook object from the current store state.
     * Shared between save and download handlers to avoid duplication.
     */
    const getExportData = useCallback((): Partial<KetabBook> => {
        const state = useKetabStore.getState();
        return {
            id: state.bookId,
            index: state.titles
                .filter((t) => t.depth === 0)
                .map((t) => ({ ...t, children: state.titles.filter((c) => c.parent === t.id && c.depth === 1) })),
            pages: state.pages.map((p) => ({
                ...p,
                content: p.footnote ? `${p.body}<div class="g-page-footer">${p.footnote}</div>` : p.body,
            })),
            title: state.bookTitle,
        } as Partial<KetabBook>;
    }, []);

    const { handleSave, handleDownload, handleReset } = useStorageActions({
        analytics: { download: 'DownloadKetab', reset: 'ResetKetab', save: 'SaveKetab' },
        getExportData,
        reset,
        storageKey: STORAGE_KEYS.ketab,
    });

    const handleRemoveFootnoteReferences = useCallback(() => {
        record('RemoveKetabFootnoteReferences');
        removeFootnoteReferences();
        toast.success('Removed footnote references and cleared footnotes from all pages');
    }, [removeFootnoteReferences]);

    return (
        <div className="space-x-2">
            <Button
                onClick={handleRemoveFootnoteReferences}
                title="Remove footnote references and clear footnotes"
                variant="outline"
            >
                <FootprintsIcon />
            </Button>
            <Button
                onClick={() => {
                    record('OpenKetabSegmentationPanel');
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
                        const state = useKetabStore.getState();
                        return ketabSegmentsToExcerpts(state.pages, state.titles, segments, options);
                    }}
                    pages={segmentationPages}
                />
            )}
            {patchCount > 0 && (
                <DialogTriggerButton
                    onClick={() => record('OpenKetabPatchesDialog')}
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
