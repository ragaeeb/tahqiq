'use client';

import { useCallback, useMemo, useState } from 'react';

import type { RawInputFiles } from '@/stores/manuscriptStore/types';

import JsonDropZone from '@/components/json-drop-zone';
import VersionFooter from '@/components/version-footer';
import { selectAllSheetLines } from '@/stores/manuscriptStore/selectors';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

import ManuscriptTableHeader from './table-header';
import TextRow from './text-row';
import Toolbar from './toolbar';

/**
 * Renders the main page layout for displaying manuscript pages.
 */
export default function Manuscript() {
    const initManuscript = useManuscriptStore((state) => state.init);
    const sheetLines = useManuscriptStore(selectAllSheetLines);
    const isInitialized = sheetLines.length > 0;
    const pagesFilter = useState<number[]>([]);
    const honorifics = useState(false);
    const selection = useState<number[]>([]);
    const [filterByPages] = pagesFilter;
    const [isHonorificsRowsOn] = honorifics;
    const [selectedRows, setSelectedRows] = selection;

    const rows = useMemo(() => {
        return sheetLines
            .filter((s) => filterByPages.length === 0 || filterByPages.includes(s.page))
            .filter((s) => (isHonorificsRowsOn ? s.includesHonorifics : true));
    }, [sheetLines, filterByPages, isHonorificsRowsOn]);

    const handleSelectionChange = useCallback(
        (id: number, selected: boolean) => {
            setSelectedRows((prev) => {
                if (selected) {
                    return [...prev, id];
                }

                return prev.filter((p) => p !== id);
            });
        },
        [setSelectedRows],
    );

    const handleSelectAll = (selected: boolean) => {
        setSelectedRows(selected ? rows.map((row) => row.id) : []);
    };

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
                                initManuscript(map as unknown as RawInputFiles);
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
            <div className="min-h-screen flex flex-col p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                <div className="flex flex-col w-full max-w">
                    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
                        <Toolbar selection={selection} />
                        {selectedRows.length > 0 && (
                            <div className="text-sm text-gray-600">
                                {selectedRows.length} row{selectedRows.length !== 1 ? 's' : ''} selected
                            </div>
                        )}
                    </div>

                    <div className="overflow-auto border border-gray-300 rounded-lg shadow-sm">
                        <table className="w-full table-fixed divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <ManuscriptTableHeader
                                    honorifics={honorifics}
                                    onSelectAll={handleSelectAll}
                                    pagesFilter={pagesFilter}
                                    rows={rows}
                                    selectedRows={selectedRows}
                                />
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {rows.map((r) => (
                                    <TextRow
                                        data={r}
                                        isSelected={selectedRows.includes(r.id)}
                                        key={r.id}
                                        onSelectionChange={handleSelectionChange}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <VersionFooter />
        </>
    );
}
