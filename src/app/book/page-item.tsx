'use client';

import React from 'react';

import type { Page } from '@/stores/bookStore/types';

import { Checkbox } from '@/components/ui/checkbox';
import HighlightableTextarea from '@/components/ui/highlightable-textarea';
import { Input } from '@/components/ui/input';
import { useBookStore } from '@/stores/bookStore/useBookStore';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

/**
 * Renders a table row for a manuscript page with editable ID, text, and selection controls.
 *
 * Allows users to select the page, edit its ID and text, and interact with the text area for advanced behaviors such as right-to-left input and line highlighting for errors.
 *
 * @param page - The transcript page to display and edit.
 */
const PageItem = ({ page }: { page: Page }) => {
    const toggleSegmentSelection = useTranscriptStore((state) => state.toggleSegmentSelection);
    const isSelected = useBookStore((state) => state.selectedPages.includes(page));
    const lineHighlights: { [lineNumber: number]: string } = {};
    if (page.errorLines) {
        for (const line of page.errorLines) {
            lineHighlights[line] = 'bg-red-100';
        }
    }

    return (
        <tr>
            <td className="px-2 py-1 align-top">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(isSelected) => toggleSegmentSelection(page as any, Boolean(isSelected))}
                />
            </td>

            <td className="px-2 py-1 space-y-1 text-xs align-top">
                <Input
                    className="bg-transparent border-none shadow-none focus:ring-0 focus:outline-none"
                    defaultValue={page.id.toString()}
                />
            </td>
            <td className={`px-4 py-1 align-top`}>
                <HighlightableTextarea
                    className={`overflow-hidden border-none shadow-none focus:ring-0 focus:outline-none`}
                    defaultValue={page.text}
                    dir="rtl"
                    lineHighlights={lineHighlights}
                />
            </td>
        </tr>
    );
};

export default React.memo(PageItem);
