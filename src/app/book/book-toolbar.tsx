'use client';

import { DownloadIcon, SaveIcon, TrashIcon } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { mapBookStateToKitab, mapKitabToLegacyFormat } from '@/lib/bookFormats';
import { downloadFile } from '@/lib/domUtils';
import { useBookStore } from '@/stores/bookStore/useBookStore';

import TocMenu from './toc-menu';

type BookToolbarProps = {
    onDeleteSelectedPages?: () => void;
};

/**
 * Renders a toolbar for manuscript management operations.
 * Currently provides functionality to export the current manuscript state as a JSON file.
 */
export default function BookToolbar({ onDeleteSelectedPages }: BookToolbarProps) {
    return (
        <div className="flex space-x-2">
            <Button
                className="bg-emerald-500"
                onClick={() => {
                    const name = prompt('Enter output file name');

                    if (name) {
                        downloadFile(
                            name.endsWith('.json') ? name : `${name}.json`,
                            JSON.stringify(mapBookStateToKitab(useBookStore.getState()), null, 2),
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
                        const kitab = mapBookStateToKitab(useBookStore.getState());
                        const legacy = mapKitabToLegacyFormat(kitab);

                        downloadFile(name.endsWith('.json') ? name : `${name}.json`, JSON.stringify(legacy, null, 2));
                    }
                }}
            >
                <DownloadIcon /> Legacy
            </Button>
            <TocMenu onBookmarkClicked={() => {}} />
            {onDeleteSelectedPages && (
                <Button onClick={onDeleteSelectedPages} variant="destructive">
                    <TrashIcon />
                </Button>
            )}
        </div>
    );
}
