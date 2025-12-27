'use client';

import { BoxIcon, DownloadIcon, RefreshCwIcon, SaveIcon } from 'lucide-react';
import { record } from 'nanolytics';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import RowToolbar from '@/app/manuscript/row-toolbar';
import { ConfirmButton } from '@/components/confirm-button';
import { DataGate } from '@/components/data-gate';
import { useSessionRestore } from '@/components/hooks/use-session-restore';
import { useStorageActions } from '@/components/hooks/use-storage-actions';
import JsonDropZone from '@/components/json-drop-zone';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Juz, RawInputFiles, SheetLine } from '@/stores/manuscriptStore/types';
import '@/lib/analytics';
import { mapManuscriptToJuz } from '@/lib/manuscript';
import { selectAllSheetLines } from '@/stores/manuscriptStore/selectors';
import '@/stores/dev';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

import { PdfDialog } from './pdf-modal';
import ManuscriptTableBody from './table-body';
import ManuscriptTableHeader from './table-header';
import ManuscriptToolbar from './toolbar';

/**
 * Renders the main page layout for displaying manuscript pages.
 */
export default function Manuscript() {
    const initManuscript = useManuscriptStore((state) => state.init);
    const initJuz = useManuscriptStore((state) => state.initFromJuz);
    const reset = useManuscriptStore((state) => state.reset);
    const rows = useManuscriptStore(selectAllSheetLines);
    const isInitialized = useManuscriptStore((state) => state.isInitialized);
    const selection = useState<SheetLine[]>([]);
    const [selectedRows, setSelectedRows] = selection;
    const [pageToPreview, setPageToPreview] = useState<number>(0);

    const handleSelectionChange = useCallback(
        (item: SheetLine, selected: boolean, isShiftPressed: boolean) => {
            setSelectedRows((prev) => {
                if (selected) {
                    // Handle shift-click range selection only if exactly one item is currently selected
                    if (isShiftPressed && prev.length === 1) {
                        const previousItem = prev[0];

                        // Find indices of both items in the full data array
                        // You'll need to pass your full data array to this function or access it from context/store
                        // Assuming you have access to `allItems` array here
                        const previousIndex = rows.indexOf(previousItem);
                        const currentIndex = rows.indexOf(item);

                        if (previousIndex !== -1 && currentIndex !== -1) {
                            const start = Math.min(previousIndex, currentIndex);
                            const end = Math.max(previousIndex, currentIndex);

                            // Get all items in the range
                            const itemsInRange = rows.slice(start, end + 1);

                            // Create a new selection that includes the previous item and all items in range
                            const newSelection = new Set(prev);
                            itemsInRange.forEach((rangeItem) => newSelection.add(rangeItem));

                            return Array.from(newSelection);
                        }
                    }

                    // Normal selection - just add the item
                    return [...prev, item];
                }

                return prev.filter((p) => p !== item);
            });
        },
        [setSelectedRows, rows],
    );

    // Session restore hook
    useSessionRestore<Juz>(STORAGE_KEYS.juz, initJuz, 'RestoreJuzFromSession');

    // Storage actions hook
    const getExportData = useCallback(() => mapManuscriptToJuz(useManuscriptStore.getState()), []);

    const { handleSave, handleDownload, handleReset } = useStorageActions({
        analytics: { download: 'DownloadManuscriptJuz', reset: 'ResetManuscript', save: 'SaveManuscriptJuz' },
        getExportData,
        reset,
        storageKey: STORAGE_KEYS.juz,
    });

    const handleSelectAll = useCallback(
        (selected: boolean) => {
            record(selected ? 'SelectAllLines' : 'ClearAllLines');
            setSelectedRows(selected ? rows : []);
        },
        [rows, setSelectedRows],
    );

    return (
        <DataGate
            dropZone={
                <JsonDropZone
                    allowedExtensions=".json,.txt"
                    description="Drag and drop the manuscript"
                    maxFiles={4}
                    onFiles={(map) => {
                        const fileNames = Object.keys(map);

                        if (fileNames.length === 1 && fileNames[0].endsWith('.json')) {
                            record('LoadManuscriptsFromJuz');
                            initJuz(map[fileNames[0]] as unknown as Juz);
                        } else {
                            record('LoadManuscriptsFromInputFiles');
                            initManuscript(map as unknown as RawInputFiles);
                        }
                    }}
                />
            }
            hasData={isInitialized}
        >
            <div className="flex min-h-screen flex-col font-[family-name:var(--font-geist-sans)]">
                <div className="flex w-full flex-col">
                    <div className="sticky top-0 z-20 flex items-center justify-between border-gray-200 border-b bg-white px-4 py-2 shadow-sm">
                        <ManuscriptToolbar selection={selection} />
                        <div className="space-x-2">
                            <Button className="bg-emerald-500" onClick={handleSave}>
                                <SaveIcon />
                            </Button>
                            <Button onClick={handleDownload}>
                                <DownloadIcon />
                            </Button>
                            <ConfirmButton onClick={handleReset}>
                                <RefreshCwIcon />
                            </ConfirmButton>
                            <Link href="/book">
                                <Button
                                    className="bg-blue-500"
                                    onClick={() => {
                                        record('MigrateManuscriptToBook');
                                    }}
                                >
                                    <BoxIcon />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="w-full border-gray-300 border-t">
                        <div className="sticky top-0 z-10 border-gray-200 border-b bg-gradient-to-r from-gray-50 to-gray-100">
                            <table className="w-full table-fixed">
                                <thead>
                                    <ManuscriptTableHeader
                                        onSelectAll={handleSelectAll}
                                        rows={rows}
                                        selection={selection}
                                    />
                                </thead>
                            </table>
                        </div>
                        <ManuscriptTableBody
                            onSelectionChange={handleSelectionChange}
                            previewPdf={setPageToPreview}
                            rows={rows}
                            selectedRows={selectedRows}
                        />
                    </div>
                </div>
            </div>
            {pageToPreview ? <PdfDialog onClose={() => setPageToPreview(0)} page={pageToPreview} /> : null}
            <RowToolbar />
        </DataGate>
    );
}
