'use client';

import { BoxIcon, SaveIcon } from 'lucide-react';
import { record } from 'nanolytics';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import type { RawInputFiles, SheetLine } from '@/stores/manuscriptStore/types';

import JsonDropZone from '@/components/json-drop-zone';
import { Button } from '@/components/ui/button';
import VersionFooter from '@/components/version-footer';
import { downloadFile } from '@/lib/domUtils';
import { mapManuscriptToJuz } from '@/lib/manuscript';
import { selectAllSheetLines } from '@/stores/manuscriptStore/selectors';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

import ManuscriptTableBody from './table-body';
import ManuscriptTableHeader from './table-header';

import '@/lib/analytics';

import ManuscriptToolbar from './toolbar';

/**
 * Renders the main page layout for displaying manuscript pages.
 */
export default function Manuscript() {
    const initManuscript = useManuscriptStore((state) => state.init);
    const rows = useManuscriptStore(selectAllSheetLines);
    const isInitialized = rows.length > 0;
    const selection = useState<SheetLine[]>([]);
    const [selectedRows, setSelectedRows] = selection;

    const handleSelectionChange = useCallback(
        (item: SheetLine, selected: boolean) => {
            setSelectedRows((prev) => {
                if (selected) {
                    return [...prev, item];
                }

                return prev.filter((p) => p !== item);
            });
        },
        [setSelectedRows],
    );

    useEffect(() => {
        const sessionData = sessionStorage.getItem('rawInputs');

        if (sessionData) {
            record('RestoreManuscriptFromSession');
            initManuscript(JSON.parse(sessionData) as unknown as RawInputFiles);
        }
    }, [initManuscript]);

    const handleSelectAll = useCallback(
        (selected: boolean) => {
            record(selected ? 'SelectAllLines' : 'ClearAllLines');
            setSelectedRows(selected ? rows : []);
        },
        [rows, setSelectedRows],
    );

    if (!isInitialized) {
        return (
            <>
                <div className="min-h-screen flex flex-col p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                    <div className="flex flex-col w-full max-w">
                        <JsonDropZone
                            allowedExtensions=".json,.txt"
                            description="Drag and drop the manuscript"
                            maxFiles={4}
                            onFiles={(map) => {
                                record('LoadManuscriptsFromInputFiles');
                                initManuscript(map as unknown as RawInputFiles);

                                sessionStorage.setItem('rawInputs', JSON.stringify(map));
                            }}
                        />
                    </div>
                </div>
                <VersionFooter />
            </>
        );
    }

    return (
        <>
            <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
                <div className="flex flex-col w-full">
                    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
                        <ManuscriptToolbar selection={selection} />
                        <div className="space-x-2">
                            <Button
                                className="bg-emerald-500"
                                onClick={() => {
                                    const name = prompt('Enter output file name');

                                    if (name) {
                                        record('DownloadManuscriptJuz', name);

                                        downloadFile(
                                            name.endsWith('.json') ? name : `${name}.json`,
                                            JSON.stringify(mapManuscriptToJuz(useManuscriptStore.getState()), null, 2),
                                        );
                                    }
                                }}
                            >
                                <SaveIcon />
                            </Button>
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

                    <div className="w-full border-t border-gray-300">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0 z-10">
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
                            rows={rows}
                            selectedRows={selectedRows}
                        />
                    </div>
                </div>
            </div>
            <VersionFooter />
        </>
    );
}
