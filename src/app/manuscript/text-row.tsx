import clsx from 'clsx';
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
    onSelectionChange: (row: SheetLine, selected: boolean) => void;
    style?: React.CSSProperties; // Add style prop for virtualization
};

const getTextInputClassName = (data: SheetLine) => {
    return clsx(
        'w-full leading-relaxed text-gray-800 border-none outline-none px-1 py-1 transition-colors duration-150',
        data.isFootnote ? '!text-sm' : '!text-xl',
        data.isPoetic && 'italic bg-purple-100',
        data.isCentered ? 'text-center' : 'text-right',
        data.isHeading && 'font-bold',
        data.includesHonorifics ? 'bg-red-200' : 'bg-transparent',
        'focus:bg-gray-50 focus:rounded',
    );
};

const getAltTextAreaClassName = (data: SheetLine) => {
    return clsx(
        `flex-1 mr-2 leading-relaxed bg-transparent border-none outline-none resize-none overflow-hidden min-h-[1.5em] px-1 py-1 transition-colors duration-150`,
        data.isFootnote ? '!text-sm' : '!text-xl',
        data.isCentered ? 'text-center' : 'text-right',
        data.isHeading && 'font-bold',
        'focus:bg-white focus:rounded',
    );
};

function TextRow({ data, isNewPage, isSelected, onSelectionChange, style }: TextRowProps) {
    const splitAltAtLineBreak = useManuscriptStore((state) => state.splitAltAtLineBreak);
    const mergeWithAbove = useManuscriptStore((state) => state.mergeWithAbove);
    const applySupportToOriginal = useManuscriptStore((state) => state.applySupportToOriginal);
    const filterByPages = useManuscriptStore((state) => state.filterByPages);
    const deleteSupport = useManuscriptStore((state) => state.deleteSupport);
    const updateText = useManuscriptStore((state) => state.updateText);

    return (
        <tr
            className={`hover:bg-gray-50 transition-colors duration-150 ease-in-out ${isNewPage ? 'border-t-4 border-t-blue-200' : ''}`}
            style={style} // Apply virtualization styles
        >
            <td aria-label="Select" className="w-12 px-4 py-4 text-center border-r border-green-100">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectionChange(data, Boolean(checked))}
                />
            </td>
            <td
                aria-label="Page"
                className={`w-20 px-4 py-4 text-left text-sm font-medium text-gray-900 border-r border-gray-100 ${data.hasInvalidFootnotes && 'bg-red-200'}`}
            >
                <Button onClick={() => filterByPages([data.page])} variant="ghost">
                    {data.page}
                </Button>
            </td>
            <td
                aria-label="Text"
                className={`w-1/2 px-4 py-4 text-xl text-right leading-relaxed text-gray-800 border-r border-gray-100`}
                dir="rtl"
            >
                <Input
                    className={getTextInputClassName(data)}
                    defaultValue={data.text}
                    dir="rtl"
                    key={data.id + '/' + data.lastUpdate}
                    onBlur={(e) => {
                        updateText(data.page, data.id, e.target.value);
                    }}
                    style={{ fontFamily: 'inherit' }}
                    type="text"
                />
            </td>
            <td
                aria-label="Support"
                className={`w-1/2 px-4 py-4 text-xl text-right leading-relaxed ${
                    data.isSimilar ? 'text-gray-800 bg-green-50' : 'text-red-600 bg-red-50'
                } transition-colors duration-150`}
                dir="rtl"
            >
                <div className="flex items-center justify-between">
                    <Button
                        aria-label="Accept Support"
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-green-200 hover:text-green-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                        onClick={() => applySupportToOriginal(data.page, data.id)}
                    >
                        ✓
                    </Button>
                    <Button
                        aria-label="Delete Support"
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-200 hover:text-red-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                        onClick={() => deleteSupport(data.page, data.id)}
                        variant="ghost"
                    >
                        🗑️
                    </Button>
                    <Button
                        aria-label="Merge With Above"
                        className="flex items-center justify-center px-2 w-8 h-8 rounded-full hover:bg-green-200 hover:text-green-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                        onClick={() => {
                            mergeWithAbove(data.page, data.id);
                        }}
                        variant="outline"
                    >
                        ↑
                    </Button>
                    <Textarea
                        className={getAltTextAreaClassName(data)}
                        dir="rtl"
                        onChange={(e) => {
                            if (e.target.value !== data.alt) {
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
