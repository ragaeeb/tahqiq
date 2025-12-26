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
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmButton } from '@/components/confirm-button';
import { Button } from '@/components/ui/button';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { downloadFile } from '@/lib/domUtils';
import { clearStorage, saveToOPFS } from '@/lib/io';
import { usePatchStore } from '@/stores/patchStore';
import type { ShamelaBook } from '@/stores/shamelaStore/types';
import { useShamelaStore } from '@/stores/shamelaStore/useShamelaStore';
import { PatchesDialogContent } from './patches-dialog';
import { SegmentationPanel } from './segmentation/SegmentationPanel';

export const Toolbar = () => {
    const patchCount = usePatchStore((state) => state.patches.length);
    const removePageMarkers = useShamelaStore((state) => state.removePageMarkers);
    const removeFootnoteReferences = useShamelaStore((state) => state.removeFootnoteReferences);
    const reset = useShamelaStore((state) => state.reset);
    const [isSegmentationPanelOpen, setIsSegmentationPanelOpen] = useState(false);

    /**
     * Creates a ShamelaBook object from the current store state.
     * Shared between save and download handlers to avoid duplication.
     */
    const getShamelaBookData = useCallback((): ShamelaBook => {
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

    const handleSave = useCallback(async () => {
        record('SaveShamela');
        const data = getShamelaBookData();

        try {
            await saveToOPFS('shamela', data);
            toast.success('Saved state');
        } catch (err) {
            console.error('Could not save shamela', err);
            downloadFile(`shamela-${Date.now()}.json`, JSON.stringify(data, null, 2));
        }
    }, [getShamelaBookData]);

    const handleDownload = useCallback(() => {
        const name = prompt('Enter output file name');

        if (name) {
            record('DownloadShamela', name);
            const data = getShamelaBookData();
            downloadFile(name.endsWith('.json') ? name : `${name}.json`, JSON.stringify(data, null, 2));
        }
    }, [getShamelaBookData]);

    const handleReset = useCallback(() => {
        record('ResetShamela');
        reset();
        clearStorage('shamela');
    }, [reset]);

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
            {isSegmentationPanelOpen && <SegmentationPanel onClose={() => setIsSegmentationPanelOpen(false)} />}
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
