import { withFormattingToolbar } from 'blumbaben';
import clsx from 'clsx';
import { BookmarkIcon, LetterTextIcon, SignatureIcon, Trash2Icon } from 'lucide-react';
import { record } from 'nanolytics';
import React from 'react';

import type { SheetLine } from '@/stores/manuscriptStore/types';

import { Input } from '@/components/ui/input';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

import { ActionButton } from './shared';

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

type AslContainerProps = {
    data: SheetLine;
};

function AslContainer({ data }: AslContainerProps) {
    const mergeWithAbove = useManuscriptStore((state) => state.mergeWithAbove);
    const mergeWithBelow = useManuscriptStore((state) => state.mergeWithBelow);
    const deleteLines = useManuscriptStore((state) => state.deleteLines);
    const updateTextLines = useManuscriptStore((state) => state.updateTextLines);

    return (
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
        </div>
    );
}

export default React.memo(AslContainer);
