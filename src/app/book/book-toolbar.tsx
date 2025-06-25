'use client';

import React from 'react';

import { Button } from '@/components/ui/button';

import TocMenu from './toc-menu';

/**
 * Renders a toolbar for manuscript management operations.
 * Currently provides functionality to export the current manuscript state as a JSON file.
 */
export default function BookToolbar() {
    return (
        <div className="flex space-x-2">
            <Button className="bg-emerald-500">💾</Button>
            <TocMenu onBookmarkClicked={() => {}} />
        </div>
    );
}
