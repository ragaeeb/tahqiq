'use client';

import {
    DownloadIcon,
    HighlighterIcon,
    MergeIcon,
    SaveIcon,
    SquareDashedIcon,
    TextCursorInputIcon,
    TrashIcon,
} from 'lucide-react';
import { record } from 'nanolytics';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';
import { JsonBrowseButton } from '@/components/json-browse-button';
import { ResetButton } from '@/components/reset-button';
import { Button } from '@/components/ui/button';
import { mapBookStateToKitab, mapKitabToLegacyFormat } from '@/lib/bookFormats';
import { STORAGE_KEYS } from '@/lib/constants';
import { downloadFile } from '@/lib/domUtils';
import { clearStorage, loadFiles } from '@/lib/io';
import { useBookStore } from '@/stores/bookStore/useBookStore';

import TocMenu from './toc-menu';
import VolumeSelector from './volume-selector';

type BookToolbarProps = {
    onDeleteSelectedPages?: () => void;
    onMergeFootnotes?: () => void;
    onReformatSelectedPages?: () => void;
    onSelectEmptyPages?: () => void;
};

/**
 * Renders a toolbar for manuscript management operations.
 * Currently provides functionality to export the current manuscript state as a JSON file.
 */
function BookToolbar({
    onDeleteSelectedPages,
    onMergeFootnotes,
    onReformatSelectedPages,
    onSelectEmptyPages,
}: BookToolbarProps) {
    const toggleHighlighter = useBookStore((state) => state.toggleHighlighter);
    const isHighlighterEnabled = useBookStore((state) => state.isHighlighterEnabled);
    const addAjza = useBookStore((state) => state.addAjza);
    const reset = useBookStore((state) => state.reset);
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="flex space-x-2">
            <VolumeSelector />
            <Button
                className="bg-emerald-500"
                onClick={async () => {
                    record('SaveBook');
                    const success = await useBookStore.getState().save();
                    if (success) {
                        toast.success('Saved book');
                    } else {
                        toast.error('Failed to save book');
                    }
                }}
            >
                <SaveIcon />
            </Button>
            <Button
                onClick={() => {
                    const state = useBookStore.getState();
                    const name = prompt('Enter output file name', state.inputFileName);

                    if (name) {
                        record('DownloadBook', name);

                        downloadFile(
                            name.endsWith('.json') ? name : `${name}.json`,
                            JSON.stringify(mapBookStateToKitab(state), null, 2),
                        );
                    }
                }}
            >
                <DownloadIcon />
            </Button>
            <Button
                onClick={() => {
                    const name = prompt('Enter output file name');

                    if (name) {
                        record('DownloadLegacyBook', name);

                        const kitab = mapBookStateToKitab(useBookStore.getState());
                        const legacy = mapKitabToLegacyFormat(kitab);

                        downloadFile(name.endsWith('.json') ? name : `${name}.json`, JSON.stringify(legacy, null, 2));
                    }
                }}
            >
                <DownloadIcon /> Legacy
            </Button>
            <ResetButton
                onReset={() => {
                    record('ResetBook');
                    if (typeof window !== 'undefined') {
                        window.history.replaceState(null, '', pathname);
                    }
                    router.replace(pathname, { scroll: false });
                    setTimeout(() => {
                        reset();
                    }, 100);
                }}
                onResetAll={async () => {
                    record('ResetBookAll');
                    if (typeof window !== 'undefined') {
                        window.history.replaceState(null, '', pathname);
                    }
                    router.replace(pathname, { scroll: false });
                    try {
                        await clearStorage(STORAGE_KEYS.ketab);
                    } catch (err) {
                        console.error('Failed to clear storage for ketab', err);
                    }
                    setTimeout(() => {
                        reset();
                    }, 100);
                }}
            />
            <TocMenu
                onBookmarkClicked={() => {
                    record('BookmarkClicked');
                }}
            />
            {onDeleteSelectedPages && (
                <Button aria-label="Delete selected pages" onClick={onDeleteSelectedPages} variant="destructive">
                    <TrashIcon />
                </Button>
            )}
            {onReformatSelectedPages && (
                <Button aria-label="Reformat selected pages" onClick={onReformatSelectedPages}>
                    <TextCursorInputIcon /> Reformat
                </Button>
            )}
            {onMergeFootnotes && (
                <Button aria-label="Merge Footnotes" className="bg-purple-500" onClick={onMergeFootnotes}>
                    <MergeIcon /> Merge Footnotes
                </Button>
            )}
            {onSelectEmptyPages && (
                <Button aria-label="Select Blank pages" className="bg-red-400" onClick={onSelectEmptyPages}>
                    <SquareDashedIcon /> Select Blank
                </Button>
            )}
            <Button
                aria-label="Highlighter"
                className={isHighlighterEnabled ? 'bg-purple-400' : undefined}
                onClick={toggleHighlighter}
            >
                <HighlighterIcon />
            </Button>
            <JsonBrowseButton
                isMulti
                onFilesSelected={async (files) => {
                    record('AddVolumes', files.length.toString());

                    addAjza(await loadFiles(files));
                }}
            >
                + Volumes
            </JsonBrowseButton>
        </div>
    );
}

export default React.memo(BookToolbar);
