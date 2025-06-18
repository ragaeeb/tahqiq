'use client';

import React, { type Dispatch, type SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { SWS_SYMBOL } from '@/lib/constants';
import { downloadFile } from '@/lib/domUtils';
import { mapManuscriptToBook } from '@/lib/legacy';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

type ToolbarProps = {
    selection: [number[], Dispatch<SetStateAction<number[]>>];
};

/**
 * Renders a toolbar for manuscript management operations.
 * Currently provides functionality to export the current manuscript state as a JSON file.
 */
export default function Toolbar({ selection: [selectedRows, setSelectedRows] }: ToolbarProps) {
    const fixTypos = useManuscriptStore((state) => state.fixTypos);

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
            {selectedRows.length > 0 && (
                <Button
                    onClick={() => {
                        fixTypos(selectedRows);
                        setSelectedRows([]);
                    }}
                    variant="outline"
                >
                    {SWS_SYMBOL}
                </Button>
            )}
            {selectedRows.length > 0 && <Button className="bg-purple-200">Mark As Poetry</Button>}
        </div>
    );
}
