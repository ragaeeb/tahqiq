'use client';

import { UndoIcon } from 'lucide-react';
import React, { type Dispatch, type SetStateAction } from 'react';

import type { SheetLine } from '@/stores/manuscriptStore/types';

import { Button } from '@/components/ui/button';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

import { ManuscriptMenu } from './menu';

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
    const updateTextLines = useManuscriptStore((state) => state.updateTextLines);
    const replaceHonorifics = useManuscriptStore((state) => state.replaceHonorifics);
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
                    <UndoIcon />
                </Button>
            )}
            <ManuscriptMenu
                autoCorrectFootnotes={() => {
                    autoCorrectFootnotes(Array.from(new Set(selectedRows.map((r) => r.page))));
                    setSelectedRows([]);
                }}
                deleteLines={() => {
                    deleteLines(selectedRows.map((row) => row.id));
                    setSelectedRows([]);
                }}
                markAsFootnotes={(isFootnote) => {
                    updateTextLines(
                        selectedRows.map((r) => r.id),
                        { isFootnote },
                    );
                    setSelectedRows([]);
                }}
                markAsHeading={(isHeading) => {
                    updateTextLines(
                        selectedRows.map((r) => r.id),
                        { isHeading },
                    );
                    setSelectedRows([]);
                }}
                markAsPoetry={(isPoetic) => {
                    updateTextLines(
                        selectedRows.map((r) => r.id),
                        { isPoetic },
                    );
                    setSelectedRows([]);
                }}
                onFixSwsSymbol={() => {
                    fixTypos(selectedRows.map((s) => s.id));
                    setSelectedRows([]);
                }}
                onReplaceSwsWithAzw={() => {
                    replaceHonorifics(selectedRows.map((r) => r.id));
                    setSelectedRows([]);
                }}
            />
        </div>
    );
}
