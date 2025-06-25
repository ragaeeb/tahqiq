'use client';

import React from 'react';

import type { Page } from '@/stores/bookStore/types';

import SubmittableInput from '@/components/submittable-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { withFormattingToolbar } from '@/components/withFormattingToolbar';
import { useBookStore } from '@/stores/bookStore/useBookStore';

type PageItemProps = {
    isSelected: boolean;
    onSelectionChange: (row: Page, selected: boolean) => void;
    page: Page;
};

const TextareaWithToolbar = withFormattingToolbar(Textarea);

/**
 * Renders a table row for a manuscript page with editable ID, text, and selection controls.
 *
 * Allows users to select the page, edit its ID and text, and interact with the text area for advanced behaviors such as right-to-left input and line highlighting for errors.
 *
 * @param page - The transcript page to display and edit.
 */
const PageItem = ({ isSelected, page }: PageItemProps) => {
    const updatePages = useBookStore((state) => state.updatePages);
    const shiftValues = useBookStore((state) => state.shiftValues);

    return (
        <tr className="border-2 border-blue-100">
            <td className="px-2 py-1 align-top">
                <Checkbox checked={isSelected} />
            </td>

            <td className="px-2 py-1 space-y-1 text-xs align-top">
                <SubmittableInput
                    className="bg-transparent border-none shadow-none focus:ring-0 focus:outline-none"
                    defaultValue={page.page.toString()}
                    key={page.id + '/' + page.lastUpdate + '/page'}
                    name="page_id"
                    onBlur={(e) => {
                        if (e.target.value !== page.page.toString()) {
                            updatePages([page.id], { page: Number(e.target.value) }, false);
                        }
                    }}
                    onSubmit={(pageNumber) => {
                        shiftValues(page.id, Number(pageNumber), 'page');
                    }}
                />
            </td>
            <td className="px-2 py-1 space-y-1 text-xs align-top">
                <SubmittableInput
                    className="bg-transparent border-none shadow-none focus:ring-0 focus:outline-none"
                    defaultValue={page.volumePage?.toString()}
                    key={page.id + '/' + page.lastUpdate + '/volumePage'}
                    name="volume_page"
                    onBlur={(e) => {
                        if (e.target.value !== page.page.toString()) {
                            updatePages([page.id], { volumePage: Number(e.target.value) }, false);
                        }
                    }}
                    onSubmit={(pageNumber) => {
                        shiftValues(page.id, Number(pageNumber), 'volumePage');
                    }}
                />
            </td>
            <td className={`px-4 py-1 align-top`}>
                <TextareaWithToolbar
                    className={`leading-relaxed resize-none overflow-hidden border-none shadow-none focus:ring-0 focus:outline-none text-lg`}
                    defaultValue={page.text}
                    dir="rtl"
                    key={page.id + '/' + page.lastUpdate + '/text'}
                    onBlur={(e) => {
                        if (e.target.value !== page.page.toString()) {
                            updatePages([page.id], { text: e.target.value }, false);
                        }
                    }}
                />
                <hr />
                <TextareaWithToolbar
                    className={`overflow-hidden border-none resize-none shadow-none focus:ring-0 focus:outline-none text-sm`}
                    defaultValue={page.footnotes}
                    dir="rtl"
                    key={page.id + '/' + page.lastUpdate + '/footnotes'}
                    onBlur={(e) => {
                        if (e.target.value !== page.page.toString()) {
                            updatePages([page.id], { footnotes: e.target.value }, false);
                        }
                    }}
                />
            </td>
        </tr>
    );
};

export default React.memo(PageItem);
