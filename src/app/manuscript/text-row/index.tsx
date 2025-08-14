import React from 'react';

import type { SheetLine } from '@/stores/manuscriptStore/types';

import { Checkbox } from '@/components/ui/checkbox';

import AslContainer from './asl-container';
import PageInfo from './page-info';
import SupportContainer from './support-container';

type TextRowProps = {
    data: SheetLine;
    isNewPage?: boolean;
    isSelected: boolean;
    onSelectionChange: (row: SheetLine, selected: boolean, isShiftPressed: boolean) => void;
    previewPdf: (page: number) => void;
    style?: React.CSSProperties; // needed for virtualization
};

function TextRow({ data, isNewPage, isSelected, onSelectionChange, previewPdf, style }: TextRowProps) {
    return (
        <tr
            className={`hover:bg-gray-50 transition-colors duration-150 ease-in-out ${isNewPage ? 'border-t-4 border-t-blue-200' : ''}`}
            style={style}
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
                className={`w-20 px-2 py-4 text-center text-sm font-medium text-gray-900 border-r border-gray-100 ${data.hasInvalidFootnotes && 'bg-red-200'}`}
            >
                <PageInfo id={data.id} page={data.page} previewPdf={previewPdf} />
            </td>
            <td
                aria-label="Text"
                className={`w-1/2 px-4 py-4 text-xl text-right leading-relaxed text-gray-800 border-r border-gray-100`}
                dir="rtl"
            >
                <AslContainer data={data} />
            </td>
            <td
                aria-label="Support"
                className={`w-1/2 px-4 py-4 text-xl text-right leading-relaxed ${
                    data.isSimilar ? 'text-gray-800 bg-green-50' : 'text-red-600 bg-red-50'
                } transition-colors duration-150`}
                dir="rtl"
            >
                <SupportContainer data={data} />
            </td>
        </tr>
    );
}

export default React.memo(TextRow);
