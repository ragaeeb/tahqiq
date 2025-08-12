import { withFormattingToolbar } from 'blumbaben';
import clsx from 'clsx';
import { BookmarkIcon, ExpandIcon, LetterTextIcon, PlusIcon, SignatureIcon, Trash2Icon } from 'lucide-react';
import { record } from 'nanolytics';
import React from 'react';

import type { SheetLine } from '@/stores/manuscriptStore/types';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

type TextRowProps = {
    data: SheetLine;
    isNewPage?: boolean;
    isSelected: boolean;
    onSelectionChange: (row: SheetLine, selected: boolean, isShiftPressed: boolean) => void;
    style?: React.CSSProperties; // Add style prop for virtualization
};

const InputWithToolbar = withFormattingToolbar(Input);

const getTextInputClassName = (data: SheetLine) => {
    return clsx(
        'w-full leading-relaxed text-gray-800 border-none outline-none px-1 py-1 transition-colors duration-150',
        data.isFootnote ? 'text-sm' : 'text-xl',
        data.isPoetic && 'italic bg-purple-100',
        data.isCentered || data.isPoetic ? 'text-center' : 'text-right',
        data.isHeading && 'font-bold',
        data.includesHonorifics ? 'bg-red-200' : 'bg-transparent',
        'focus:bg-gray-50 focus:rounded',
    );
};

const getAltTextAreaClassName = (data: SheetLine) => {
    return clsx(
        `flex-1 mr-2 leading-relaxed bg-transparent border-none outline-none resize-none overflow-hidden min-h-[1.5em] px-1 py-1 transition-colors duration-150`,
        data.isFootnote ? 'text-sm' : 'text-xl',
        data.isCentered ? 'text-center' : 'text-right',
        data.isHeading && 'font-bold',
        'focus:bg-white focus:rounded',
    );
};

const ActionButton = (props: any) => {
    return (
        <Button
            className="flex items-center justify-center px-2 w-4 h-4 rounded-full hover:bg-green-200 hover:text-green-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            variant="ghost"
            {...props}
        />
    );
};

function TextRow({ data, isNewPage, isSelected, onSelectionChange, style }: TextRowProps) {
    const splitAltAtLineBreak = useManuscriptStore((state) => state.splitAltAtLineBreak);
    const mergeWithAbove = useManuscriptStore((state) => state.mergeWithAbove);
    const mergeWithBelow = useManuscriptStore((state) => state.mergeWithBelow);
    const filterByPages = useManuscriptStore((state) => state.filterByPages);
    const deleteSupport = useManuscriptStore((state) => state.deleteSupport);
    const deleteLines = useManuscriptStore((state) => state.deleteLines);
    const updateTextLines = useManuscriptStore((state) => state.updateTextLines);
    const saveId = useManuscriptStore((state) => state.saveId);
    const expandFilteredRow = useManuscriptStore((state) => state.expandFilteredRow);

    return (
        <tr
            className={`hover:bg-gray-50 transition-colors duration-150 ease-in-out ${isNewPage ? 'border-t-4 border-t-blue-200' : ''}`}
            style={style} // Apply virtualization styles
        >
            <td aria-label="Select" className="w-12 px-4 py-4 text-center border-r border-green-100">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(...args) => {
                        onSelectionChange(data, ...args);
                    }}
                />
            </td>
            <td
                aria-label="Page"
                className={`w-20 px-4 py-4 text-left text-sm font-medium text-gray-900 border-r border-gray-100 ${data.hasInvalidFootnotes && 'bg-red-200'}`}
            >
                <div className="flex items-center gap-1">
                    <Button
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                            record('FilterByPageOfLine');
                            filterByPages([data.page]);
                        }}
                        size="sm"
                        variant="ghost"
                    >
                        {data.page}
                    </Button>
                    <Button
                        className="h-6 w-6 p-0 text-xs"
                        onClick={() => {
                            record('SaveRow');
                            saveId(data.id);
                        }}
                        size="sm"
                        variant="ghost"
                    >
                        ★
                    </Button>
                </div>
            </td>
            <td
                aria-label="Text"
                className={`w-1/2 px-4 py-4 text-xl text-right leading-relaxed text-gray-800 border-r border-gray-100`}
                dir="rtl"
            >
                <div className="flex items-center justify-between">
                    <ActionButton
                        aria-label="Delete Asl"
                        onClick={() => {
                            record('DeleteAsl');
                            deleteLines([data.id]);
                        }}
                    >
                        <Trash2Icon />
                    </ActionButton>
                    <ActionButton
                        aria-label="Merge With Above"
                        onClick={() => {
                            record('MergeAslWithAbove');
                            mergeWithAbove(data.page, data.id, true);
                        }}
                    >
                        ↑
                    </ActionButton>
                    <ActionButton
                        aria-label="Merge With Below"
                        onClick={() => {
                            record('MergeAslWithBelow');
                            mergeWithBelow(data.page, data.id, true);
                        }}
                    >
                        ↓
                    </ActionButton>
                    <InputWithToolbar
                        className={getTextInputClassName(data)}
                        defaultValue={data.text}
                        dir="rtl"
                        key={data.id + '/' + data.lastUpdate}
                        onBlur={(e) => {
                            if (data.text !== e.target.value) {
                                record('UpdateObservationText');
                                updateTextLines([data.id], { text: e.target.value }, false);
                            }
                        }}
                        style={{ fontFamily: 'inherit' }}
                        type="text"
                    />
                    {!data.isHeading && (
                        <ActionButton
                            aria-label="Mark as Heading"
                            onClick={() => {
                                record('MarkAsHeading');
                                updateTextLines([data.id], { isHeading: true });
                            }}
                        >
                            <BookmarkIcon />
                        </ActionButton>
                    )}
                    {data.isFootnote && (
                        <ActionButton
                            aria-label="Clear Footnote"
                            onClick={() => {
                                record('ClearFootnote');
                                updateTextLines([data.id], { isFootnote: false });
                            }}
                        >
                            x̶₁̶
                        </ActionButton>
                    )}
                    {!data.isFootnote && (
                        <ActionButton
                            aria-label="Mark as Footnote"
                            onClick={() => {
                                record('MarkAsFootnote');
                                updateTextLines([data.id], { isFootnote: true });
                            }}
                        >
                            x₁
                        </ActionButton>
                    )}
                    {data.isPoetic && (
                        <ActionButton
                            aria-label="Clear Poetry"
                            onClick={() => {
                                record('ClearPoetry');
                                updateTextLines([data.id], { isPoetic: false });
                            }}
                        >
                            <LetterTextIcon />
                        </ActionButton>
                    )}
                    {!data.isPoetic && (
                        <ActionButton
                            aria-label="Mark as Poetry"
                            onClick={() => {
                                record('MarkAsPoetry');
                                updateTextLines([data.id], { isPoetic: true });
                            }}
                        >
                            <SignatureIcon />
                        </ActionButton>
                    )}
                    <ActionButton
                        aria-label="Expand"
                        onClick={() => {
                            record('ExpandFilteredRow');
                            expandFilteredRow(data.id);
                        }}
                    >
                        <ExpandIcon />
                    </ActionButton>
                </div>
            </td>
            <td
                aria-label="Support"
                className={`w-1/2 px-4 py-4 text-xl text-right leading-relaxed ${
                    data.isSimilar ? 'text-gray-800 bg-green-50' : 'text-red-600 bg-red-50'
                } transition-colors duration-150`}
                dir="rtl"
            >
                <div className="flex items-center justify-between">
                    <ActionButton
                        aria-label="Accept Support"
                        onClick={() => {
                            record('ApplyAltToAsl');
                            updateTextLines([data.id], { text: data.alt });
                        }}
                    >
                        ✓
                    </ActionButton>
                    <ActionButton
                        aria-label="Delete Support"
                        onClick={() => {
                            record('DeleteAlt');
                            deleteSupport(data.page, data.id);
                        }}
                    >
                        <Trash2Icon />
                    </ActionButton>
                    <ActionButton
                        aria-label="Merge With Above"
                        onClick={() => {
                            record('MergeAltWithAbove');
                            mergeWithAbove(data.page, data.id);
                        }}
                    >
                        ↑
                    </ActionButton>
                    <ActionButton
                        aria-label="Merge With Below"
                        onClick={() => {
                            record('MergeAltWithBelow');
                            mergeWithBelow(data.page, data.id);
                        }}
                    >
                        ↓
                    </ActionButton>
                    <Textarea
                        className={getAltTextAreaClassName(data)}
                        dir="rtl"
                        onChange={(e) => {
                            if (e.target.value !== data.alt) {
                                record('EditAltText');
                                splitAltAtLineBreak(data.page, data.id, e.target.value);
                            }
                        }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                        }}
                        placeholder="✗"
                        rows={1}
                        style={{ fontFamily: 'inherit' }}
                        value={data.alt || ''}
                    />
                </div>
            </td>
        </tr>
    );
}

export default React.memo(TextRow);
