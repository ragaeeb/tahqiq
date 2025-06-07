'use client';

import React from 'react';

import type { Page } from '@/stores/manuscriptStore/types';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

import HighlightableTextarea from './ui/highlightable-textarea';

/**
 * Renders a table row for a transcript page with editable start/end times, text, and selection controls.
 *
 * Allows users to select the page, edit its timing and text, and interact with the text area for advanced behaviors such as right-to-left input, auto-resizing, and custom paste handling for Arabic text.
 *
 * @param page - The transcript page to display and edit.
 */
const PageItem = ({ page }: { page: Page }) => {
    const { toggleSegmentSelection } = useTranscriptStore.getInitialState();
    const isSelected = useManuscriptStore((state) => state.selectedPages.includes(page));
    const lineHighlights: { [lineNumber: number]: string } = page.errorLines?.reduce(
        (acc, e) => ({ ...acc, [e]: 'bg-red-100' }),
        {} as any,
    );

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
                    defaultValue={page.id}
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
