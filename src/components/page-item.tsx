'use client';

import React from 'react';

import type { Page } from '@/stores/manuscriptStore/types';

import { Textarea } from '@/components/ui/textarea';
import { autoResize } from '@/lib/domUtils';

/**
 * Renders a table row for a transcript page with editable start/end times, text, and selection controls.
 *
 * Allows users to select the page, edit its timing and text, and interact with the text area for advanced behaviors such as right-to-left input, auto-resizing, and custom paste handling for Arabic text.
 *
 * @param page - The transcript page to display and edit.
 */
const PageItem = ({ page }: { page: Page }) => {
    return (
        <tr>
            <td className={`px-4 py-1 align-top`}>
                <Textarea
                    className={`overflow-hidden border-none shadow-none focus:ring-0 focus:outline-none`}
                    defaultValue={page.text}
                    dir="rtl"
                    ref={(el) => {
                        if (el) {
                            autoResize(el);
                        }
                    }}
                    rows={4}
                />
            </td>
        </tr>
    );
};

export default React.memo(PageItem);
