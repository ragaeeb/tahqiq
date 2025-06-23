'use client';

import Link from 'next/link';
import React, { type Dispatch, type SetStateAction } from 'react';

import type { SheetLine } from '@/stores/manuscriptStore/types';

import { Button } from '@/components/ui/button';
import { AZW_SYMBOL, SWS_SYMBOL } from '@/lib/constants';
import { downloadFile } from '@/lib/domUtils';
import { mapManuscriptToBook } from '@/lib/legacy';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

type ToolbarProps = {
    selection: [SheetLine[], Dispatch<SetStateAction<SheetLine[]>>];
};

/**
 * Renders a toolbar for manuscript management operations.
 * Currently provides functionality to export the current manuscript state as a JSON file.
 */
export default function ManuscriptToolbar({ selection: [selectedRows, setSelectedRows] }: ToolbarProps) {
    const fixTypos = useManuscriptStore((state) => state.fixTypos);
    const autoCorrectFootnotes = useManuscriptStore((state) => state.autoCorrectFootnotes);
    const toggleFootnotes = useManuscriptStore((state) => state.toggleFootnotes);
    const replaceHonorifics = useManuscriptStore((state) => state.replaceHonorifics);
    const setPoetry = useManuscriptStore((state) => state.setPoetry);
    const deleteLines = useManuscriptStore((state) => state.deleteLines);
    const filterByIds = useManuscriptStore((state) => state.filterByIds);
    const isFilterSet = useManuscriptStore((state) => state.idsFilter.size > 0);

    return (
        <div className="flex space-x-2">
            <Button
                className="bg-emerald-500"
                onClick={() => {
                    downloadFile(
                        `${Date.now()}.json`,
                        JSON.stringify(mapManuscriptToBook(useManuscriptStore.getState()), null, 2),
                    );
                }}
            >
                💾
            </Button>
            <Link href="/book">
                <Button className="bg-blue-500">📦</Button>
            </Link>
            {isFilterSet && (
                <Button
                    onClick={() => {
                        filterByIds([]);
                    }}
                    variant="destructive"
                >
                    🔁
                </Button>
            )}
            {selectedRows.length > 0 && (
                <Button
                    onClick={() => {
                        fixTypos(selectedRows.map((s) => s.id));
                        setSelectedRows([]);
                    }}
                    variant="outline"
                >
                    Apply {SWS_SYMBOL}
                </Button>
            )}
            {selectedRows.length > 0 && (
                <Button
                    onClick={() => {
                        autoCorrectFootnotes(Array.from(new Set(selectedRows.map((r) => r.page))));
                        setSelectedRows([]);
                    }}
                    variant="outline"
                >
                    Autocorrect Footnotes
                </Button>
            )}
            {selectedRows.length > 0 && (
                <Button
                    onClick={() => {
                        toggleFootnotes(selectedRows.map((r) => r.id));
                        setSelectedRows([]);
                    }}
                    variant="outline"
                >
                    Toggle Footnotes
                </Button>
            )}
            {selectedRows.length > 0 && (
                <Button
                    onClick={() => {
                        replaceHonorifics(selectedRows.map((r) => r.id));
                        setSelectedRows([]);
                    }}
                    variant="outline"
                >
                    {AZW_SYMBOL}→{SWS_SYMBOL}
                </Button>
            )}
            {selectedRows.length > 0 && (
                <Button
                    className="bg-purple-400"
                    onClick={() => {
                        const pageToIds: Record<number, number[]> = {};

                        selectedRows.forEach((row) => {
                            if (!pageToIds[row.page]) {
                                pageToIds[row.page] = [];
                            }

                            pageToIds[row.page].push(row.id);
                        });

                        setPoetry(pageToIds);
                    }}
                >
                    Mark As Poetry
                </Button>
            )}
            {selectedRows.length > 0 && (
                <Button
                    onClick={() => {
                        deleteLines(selectedRows.map((row) => row.id));
                    }}
                    variant="destructive"
                >
                    ✘
                </Button>
            )}
        </div>
    );
}
