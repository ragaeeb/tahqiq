import clsx from 'clsx';
import { Trash2Icon } from 'lucide-react';
import { record } from 'nanolytics';
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { SheetLine } from '@/stores/manuscriptStore/types';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

import { ActionButton } from './shared';

type SupportContainerProps = { data: SheetLine };

const getAltTextAreaClassName = (data: SheetLine) => {
    return clsx(
        `flex-1 mr-2 leading-relaxed bg-transparent border-none outline-none resize-none overflow-hidden min-h-[1.5em] px-1 py-1 transition-colors duration-150`,
        data.isFootnote ? 'text-sm' : 'text-xl',
        data.isCentered ? 'text-center' : 'text-right',
        data.isHeading && 'font-bold',
        'focus:rounded focus:bg-white',
    );
};

function SupportContainer({ data }: SupportContainerProps) {
    const splitAltAtLineBreak = useManuscriptStore((state) => state.splitAltAtLineBreak);
    const mergeWithAbove = useManuscriptStore((state) => state.mergeWithAbove);
    const mergeWithBelow = useManuscriptStore((state) => state.mergeWithBelow);
    const deleteSupport = useManuscriptStore((state) => state.deleteSupport);
    const updateTextLines = useManuscriptStore((state) => state.updateTextLines);

    return (
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
                    target.style.height = `${target.scrollHeight}px`;
                }}
                placeholder="✗"
                rows={1}
                style={{ fontFamily: 'inherit' }}
                value={data.alt || ''}
            />
        </div>
    );
}

export default React.memo(SupportContainer);
