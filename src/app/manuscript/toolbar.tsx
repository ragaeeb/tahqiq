'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { SWS_SYMBOL } from '@/lib/constants';
import { downloadFile } from '@/lib/domUtils';
import { mapManuscriptToBook } from '@/lib/legacy';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

type ToolbarProps = {
    onFixTyposClicked: () => void;
    selectionCount: number;
};

/**
 * Renders a toolbar for manuscript management operations.
 * Currently provides functionality to export the current manuscript state as a JSON file.
 */
export default function Toolbar({ onFixTyposClicked, selectionCount }: ToolbarProps) {
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
            {selectionCount > 0 && (
                <Button onClick={onFixTyposClicked} variant="outline">
                    {SWS_SYMBOL}
                </Button>
            )}
        </div>
    );
}
