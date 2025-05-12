'use client';

import type { Segment } from '@/stores/useTranscriptStore';

import { timeToSeconds } from '@/lib/time';
import clsx from 'clsx';
import { formatSecondsToTimestamp } from 'paragrafs';
import React, { useCallback } from 'react';

type Props = {
    currentPart: string;
    onUpdate: (part: string, update: Partial<Segment> & { id: number }) => void;
    onWordSelected: (word: any) => void;
    pageUrlTemplate: string;
    segments: Segment[];
    selectedIds: number[];
    toggleSegmentSelection: (id: number, selected: boolean) => void;
};

export default function Transcript({
    currentPart,
    onUpdate,
    onWordSelected,
    pageUrlTemplate,
    segments,
    selectedIds,
    toggleSegmentSelection,
}: Props) {
    const handleTimeBlur = useCallback(
        (id: number, field: 'end' | 'start') => (e: React.FocusEvent<HTMLInputElement>) => {
            onUpdate(currentPart, { [field]: timeToSeconds(e.target.value), id });
        },
        [currentPart, onUpdate],
    );

    const autoResize = (ta: HTMLTextAreaElement) => {
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
    };

    return (
        <div className="overflow-auto border rounded">
            <table className="w-full table-auto divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-2 py-1 w-8 text-left">#</th>
                        <th className="px-2 py-1 w-36 text-left">Time</th>
                        <th className="px-4 py-1 text-right">النص</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {segments.map((seg) => (
                        <tr className={clsx(seg.status === 'done' && 'bg-green-50')} key={seg.id}>
                            <td className="px-2 py-1 align-top">
                                <input
                                    checked={selectedIds.includes(seg.id)}
                                    className="form-checkbox"
                                    onChange={(e) => toggleSegmentSelection(seg.id, e.target.checked)}
                                    type="checkbox"
                                />
                            </td>

                            <td className="px-2 py-1 space-y-1 text-xs align-top">
                                <input
                                    className="block w-full border rounded p-1 text-xs"
                                    defaultValue={formatSecondsToTimestamp(seg.start)}
                                    onBlur={handleTimeBlur(seg.id, 'start')}
                                    onDoubleClick={() => onWordSelected({ id: seg.id, start: seg.start })}
                                />
                                <input
                                    className="block w-full border rounded p-1 text-xs"
                                    defaultValue={formatSecondsToTimestamp(seg.end)}
                                    onBlur={handleTimeBlur(seg.id, 'end')}
                                    onDoubleClick={() => onWordSelected({ id: seg.id, start: seg.end })}
                                />
                                <a
                                    className="text-[0.6rem] underline block"
                                    href={pageUrlTemplate.replace('{part-page}', Math.floor(seg.start).toString())}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    🔗 ({formatSecondsToTimestamp(Math.ceil(seg.end - seg.start))})
                                </a>
                            </td>

                            <td className="px-4 py-1 align-top">
                                <textarea
                                    className="w-full h-full min-h-[4rem] border rounded p-2 text-sm resize-none whitespace-pre-wrap text-right"
                                    defaultValue={seg.text}
                                    dir="rtl"
                                    onBlur={(e) => {
                                        autoResize(e.currentTarget);
                                        onUpdate(currentPart, { id: seg.id, text: e.target.value });
                                    }}
                                    onSelect={(e) => {
                                        const { selectionEnd, selectionStart, value } = e.currentTarget;
                                        if (selectionStart !== selectionEnd && seg.tokens) {
                                            const sel = value.substring(selectionStart!, selectionEnd!);
                                            const word = findFirstWordForText(seg.tokens, sel);
                                            if (word)
                                                onWordSelected({
                                                    id: seg.id,
                                                    ...word,
                                                    selectionStart,
                                                });
                                        } else {
                                            onWordSelected(null);
                                        }
                                    }}
                                    ref={(el) => {
                                        if (el) {
                                            autoResize(el);
                                        }
                                    }}
                                    rows={4}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
