'use client';

import { UndoIcon } from 'lucide-react';
import { record } from 'nanolytics';
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
    const mergeWithAbove = useManuscriptStore((state) => state.mergeWithAbove);
    const deleteLines = useManuscriptStore((state) => state.deleteLines);
    const clearOutPages = useManuscriptStore((state) => state.clearOutPages);
    const filterByIds = useManuscriptStore((state) => state.filterByIds);
    const isFilterSet = useManuscriptStore((state) => state.idsFilter.size > 0);

    return (
        <div className="flex space-x-2">
            {isFilterSet && (
                <Button
                    onClick={() => {
                        record('ResetManuscriptFilter');
                        filterByIds([]);
                    }}
                    variant="destructive"
                >
                    <UndoIcon />
                </Button>
            )}
            <ManuscriptMenu
                autoCorrectFootnotes={() => {
                    record('AutocorrectFootnotes');
                    autoCorrectFootnotes(Array.from(new Set(selectedRows.map((r) => r.page))));
                    setSelectedRows([]);
                }}
                clearOutPages={() => {
                    record('ClearOutPages', selectedRows.length.toString());
                    clearOutPages(selectedRows.map((row) => row.page));
                    setSelectedRows([]);
                }}
                deleteLines={() => {
                    record('DeleteLines', selectedRows.length.toString());
                    deleteLines(selectedRows.map((row) => row.id));
                    setSelectedRows([]);
                }}
                markAsFootnotes={(isFootnote) => {
                    record('MarkAsFootnotes', isFootnote.toString());
                    updateTextLines(
                        selectedRows.map((r) => r.id),
                        { isFootnote },
                    );
                    setSelectedRows([]);
                }}
                markAsHeading={(isHeading) => {
                    record('MarkAsHeading', isHeading.toString());

                    updateTextLines(
                        selectedRows.map((r) => r.id),
                        { isHeading },
                    );
                    setSelectedRows([]);
                }}
                markAsPoetry={(isPoetic) => {
                    record('MarkAsPoetry', isPoetic.toString());

                    updateTextLines(
                        selectedRows.map((r) => r.id),
                        { isPoetic },
                    );
                    setSelectedRows([]);
                }}
                mergeWithAbove={() => {
                    record('MergeAslWithAbove');
                    mergeWithAbove(selectedRows[0].page, selectedRows[0].id, true);
                }}
                onFixSwsSymbol={() => {
                    record('FixSwsSymbol');

                    fixTypos(selectedRows.map((s) => s.id));
                    setSelectedRows([]);
                }}
                onReplaceSwsWithAzw={() => {
                    record('ReplaceSwsWithAzw', selectedRows.length.toString());

                    replaceHonorifics(selectedRows.map((r) => r.id));
                    setSelectedRows([]);
                }}
            />
        </div>
    );
}
