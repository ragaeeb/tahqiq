'use client';

import React, { type Dispatch, type SetStateAction } from 'react';

import type { SheetLine } from '@/stores/manuscriptStore/types';

import { Button } from '@/components/ui/button';
import { AZW_SYMBOL, SWS_SYMBOL } from '@/lib/constants';
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
                        setPoetry(
                            selectedRows.map((r) => r.id),
                            true,
                        );
                    }}
                >
                    + Poetry
                </Button>
            )}
            {selectedRows.length > 0 && (
                <Button
                    className="bg-purple-200"
                    onClick={() => {
                        setPoetry(
                            selectedRows.map((r) => r.id),
                            false,
                        );
                    }}
                    variant="outline"
                >
                    - Poetry
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
