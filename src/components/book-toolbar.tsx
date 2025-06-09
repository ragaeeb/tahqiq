'use client';

import React from 'react';

import { downloadFile } from '@/lib/domUtils';
import { mapManuscriptToBook } from '@/lib/legacy';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

import { Button } from './ui/button';

/**
 * Renders a toolbar for manuscript management operations.
 * Currently provides functionality to export the current manuscript state as a JSON file.
 */
export default function BookToolbar() {
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
        </div>
    );
}
