'use client';

import React, { type Dispatch, type SetStateAction } from 'react';

import type { SheetLine } from '@/stores/manuscriptStore/types';

import { Button } from '@/components/ui/button';
import { AZW_SYMBOL, SWS_SYMBOL } from '@/lib/constants';
import { downloadFile } from '@/lib/domUtils';
import { mapManuscriptToBook } from '@/lib/legacy';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

type ToolbarProps = {
    idsFilter: [number[], Dispatch<SetStateAction<number[]>>];
    selection: [SheetLine[], Dispatch<SetStateAction<SheetLine[]>>];
};

/**
 * Renders a toolbar for manuscript management operations.
 * Currently provides functionality to export the current manuscript state as a JSON file.
 */
export default function ManuscriptToolbar({
    idsFilter: [filterByIds, setFilterByIds],
    selection: [selectedRows, setSelectedRows],
}: ToolbarProps) {
    const fixTypos = useManuscriptStore((state) => state.fixTypos);
    const autoCorrectFootnotes = useManuscriptStore((state) => state.autoCorrectFootnotes);
    const toggleFootnotes = useManuscriptStore((state) => state.toggleFootnotes);
    const replaceHonorifics = useManuscriptStore((state) => state.replaceHonorifics);

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
            {filterByIds.length > 0 && (
                <Button
                    onClick={() => {
                        setFilterByIds([]);
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
                    {SWS_SYMBOL}
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
            {selectedRows.length > 0 && <Button className="bg-purple-200">Mark As Poetry</Button>}
        </div>
    );
}
