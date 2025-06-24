'use client';

import React from 'react';

import type { Page } from '@/stores/bookStore/types';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useBookStore } from '@/stores/bookStore/useBookStore';

/**
 * Renders a table row for a manuscript page with editable ID, text, and selection controls.
 *
 * Allows users to select the page, edit its ID and text, and interact with the text area for advanced behaviors such as right-to-left input and line highlighting for errors.
 *
 * @param page - The transcript page to display and edit.
 */
const PageItem = ({ page }: { page: Page }) => {
    const isSelected = useBookStore((state) => state.selectedPages.includes(page));

    return (
        <tr className="border-2 border-blue-100">
            <td className="px-2 py-1 align-top">
                <Checkbox checked={isSelected} />
            </td>

            <td className="px-2 py-1 space-y-1 text-xs align-top">
                <Input
                    className="bg-transparent border-none shadow-none focus:ring-0 focus:outline-none"
                    defaultValue={page.id.toString()}
                />
            </td>
            <td className="px-2 py-1 space-y-1 text-xs align-top">
                <Input
                    className="bg-transparent border-none shadow-none focus:ring-0 focus:outline-none"
                    defaultValue={page.id.toString()}
                />
            </td>
            <td className={`px-4 py-1 align-top`}>
                <Textarea
                    className={`leading-relaxed resize-none overflow-hidden border-none shadow-none focus:ring-0 focus:outline-none`}
                    defaultValue={page.text}
                    dir="rtl"
                />
                <hr />
                <Textarea
                    className={`overflow-hidden border-none resize-none shadow-none focus:ring-0 focus:outline-none text-xs`}
                    defaultValue={page.footnotes}
                    dir="rtl"
                />
            </td>
        </tr>
    );
};

export default React.memo(PageItem);
