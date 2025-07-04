'use client';

import { BotIcon, DownloadIcon, MergeIcon, SaveIcon, TextCursorInputIcon, TrashIcon } from 'lucide-react';
import { record } from 'nanolytics';
import React from 'react';

import { Button } from '@/components/ui/button';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { mapBookStateToKitab, mapKitabToLegacyFormat } from '@/lib/bookFormats';
import { downloadFile } from '@/lib/domUtils';
import { useBookStore } from '@/stores/bookStore/useBookStore';

import TocMenu from './toc-menu';
import { TranslateDialog } from './translate-dialog';

type BookToolbarProps = {
    onDeleteSelectedPages?: () => void;
    onMergeFootnotes?: () => void;
    onReformatSelectedPages?: () => void;
};

/**
 * Renders a toolbar for manuscript management operations.
 * Currently provides functionality to export the current manuscript state as a JSON file.
 */
export default function BookToolbar({
    onDeleteSelectedPages,
    onMergeFootnotes,
    onReformatSelectedPages,
}: BookToolbarProps) {
    return (
        <div className="flex space-x-2">
            <Button
                className="bg-emerald-500"
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
                <SaveIcon />
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
                    <TextCursorInputIcon />
                </Button>
            )}
            {onMergeFootnotes && (
                <Button aria-label="Merge Footnotes" className="bg-purple-500" onClick={onMergeFootnotes}>
                    <MergeIcon />
                </Button>
            )}
            <DialogTriggerButton
                aria-label="Translate Book"
                onClick={() => {
                    record('TranslateBook');
                }}
                renderContent={() => <TranslateDialog />}
                variant="outline"
            >
                <BotIcon />
            </DialogTriggerButton>
        </div>
    );
}
