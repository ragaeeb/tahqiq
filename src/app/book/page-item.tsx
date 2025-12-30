'use client';

import { withFormattingToolbar } from 'blumbaben';
import { DyeLight } from 'dyelight';
import { record } from 'nanolytics';
import type { FocusEvent } from 'react';
import React, { useMemo } from 'react';
import SubmittableInput from '@/components/submittable-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { getCharacterErrorHighlights } from '@/lib/styling';
import type { Page } from '@/stores/bookStore/types';
import { useBookStore } from '@/stores/bookStore/useBookStore';

type PageItemProps = { isSelected: boolean; onSelectionChange: (row: Page, selected: boolean) => void; page: Page };

const HTAWithToolbar = withFormattingToolbar(DyeLight);

const TextAreaWithToolbar = withFormattingToolbar(Textarea);

const getBorderForRow = (page: Page) => {
    if (page.hasHeader) {
        return `border-4 border-purple-300`;
    }

    return `border-2 border-blue-100`;
};

/**
 * Renders a table row for a manuscript page with editable ID, text, and selection controls.
 *
 * Allows users to select the page, edit its ID and text, and interact with the text area for advanced behaviors such as right-to-left input and line highlighting for errors.
 *
 * @param page - The transcript page to display and edit.
 */
const PageItem = ({ isSelected, onSelectionChange, page }: PageItemProps) => {
    const updatePages = useBookStore((state) => state.updatePages);
    const shiftValues = useBookStore((state) => state.shiftValues);
    const isHighlighterEnabled = useBookStore((state) => state.isHighlighterEnabled);

    const bodyCharacterHighlights = useMemo(() => {
        const result = getCharacterErrorHighlights(page.text);
        return result.length > 0 && result;
    }, [page.text]);

    const footnoteCharacterHighlights = useMemo(() => {
        const result = page.footnotes && getCharacterErrorHighlights(page.footnotes);
        return result?.length && result;
    }, [page.footnotes]);

    const BodyTextArea = isHighlighterEnabled && bodyCharacterHighlights ? HTAWithToolbar : TextAreaWithToolbar;
    const FooterTextArea = isHighlighterEnabled && footnoteCharacterHighlights ? HTAWithToolbar : TextAreaWithToolbar;

    return (
        <tr className={getBorderForRow(page)}>
            <td className="px-2 py-1 align-top">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectionChange(page, Boolean(checked))}
                />
            </td>

            <td className="space-y-1 px-2 py-1 align-top text-xs">
                <SubmittableInput
                    className="border-none bg-transparent shadow-none focus:outline-none focus:ring-0"
                    defaultValue={page.page.toString()}
                    key={`${page.id}/${page.lastUpdate}/page`}
                    name="page_id"
                    onBlur={(e) => {
                        if (e.target.value !== page.page.toString()) {
                            record('UpdatePageNumber');
                            updatePages([page.id], { page: Number(e.target.value) }, false);
                        }
                    }}
                    onSubmit={(pageNumber) => {
                        record('ShiftPageNumbers');
                        shiftValues(page.id, Number(pageNumber), 'page');
                    }}
                />
            </td>
            <td className="space-y-1 px-2 py-1 align-top text-xs">
                <SubmittableInput
                    className="border-none bg-transparent shadow-none focus:outline-none focus:ring-0"
                    defaultValue={page.volumePage?.toString()}
                    key={`${page.id}/${page.lastUpdate}/volumePage`}
                    name="volume_page"
                    onBlur={(e) => {
                        if (e.target.value !== page.volumePage?.toString()) {
                            record('UpdateVolumePage');
                            updatePages([page.id], { volumePage: Number(e.target.value) }, false);
                        }
                    }}
                    onSubmit={(pageNumber) => {
                        record('ShiftVolumePages');
                        shiftValues(page.id, Number(pageNumber), 'volumePage');
                    }}
                />
            </td>
            <td className={`px-4 py-1 align-top`}>
                <BodyTextArea
                    {...(bodyCharacterHighlights && { highlights: bodyCharacterHighlights })}
                    className={`resize-none overflow-hidden border-none text-lg leading-relaxed shadow-none focus:outline-none focus:ring-0`}
                    defaultValue={page.text}
                    dir="rtl"
                    key={`${page.id}/${page.lastUpdate}/text`}
                    onBlur={(e: FocusEvent<HTMLTextAreaElement>) => {
                        if (e.target.value !== page.text.toString()) {
                            record('UpdatePageText');
                            updatePages([page.id], { text: e.target.value }, false);
                        }
                    }}
                />
                {page.footnotes && (
                    <>
                        <hr />
                        <FooterTextArea
                            className={`resize-none overflow-hidden border-none text-sm shadow-none focus:outline-none focus:ring-0`}
                            defaultValue={page.footnotes}
                            dir="rtl"
                            key={`${page.id}/${page.lastUpdate}/footnotes`}
                            {...(footnoteCharacterHighlights && { highlights: footnoteCharacterHighlights })}
                            onBlur={(e: FocusEvent<HTMLTextAreaElement>) => {
                                if (e.target.value !== page.footnotes?.toString()) {
                                    record('UpdatePageFootnote');
                                    updatePages([page.id], { footnotes: e.target.value }, false);
                                }
                            }}
                        />
                    </>
                )}
            </td>
        </tr>
    );
};

export default React.memo(PageItem);
