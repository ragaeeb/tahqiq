'use client';

import { timeToSeconds } from '@/lib/time';
import { type Segment, useTranscriptStore } from '@/stores/useTranscriptStore';
import clsx from 'clsx';
import { formatSecondsToTimestamp, getFirstTokenForSelection } from 'paragrafs';
import React from 'react';

type Props = {
    segment: Segment;
};

export default function SegmentItem({ segment }: Props) {
    const { selectedIds, setSelectedToken, toggleSegmentSelection, updateSegment } = useTranscriptStore();

    const autoResize = (textArea: HTMLTextAreaElement) => {
        textArea.style.height = 'auto';
        textArea.style.height = `${textArea.scrollHeight}px`;
    };

    return (
        <tr className={clsx(segment.status === 'done' && 'bg-green-50')} key={segment.id}>
            <td className="px-2 py-1 align-top">
                <input
                    checked={selectedIds.includes(segment.id)}
                    className="form-checkbox"
                    onChange={(e) => toggleSegmentSelection(segment.id, e.target.checked)}
                    type="checkbox"
                />
            </td>

            <td className="px-2 py-1 space-y-1 text-xs align-top">
                <input
                    className="block w-full border rounded p-1 text-xs"
                    defaultValue={formatSecondsToTimestamp(segment.start)}
                    onBlur={(e) => {
                        updateSegment({ id: segment.id, start: timeToSeconds(e.target.value) });
                    }}
                />
                <input
                    className="block w-full border rounded p-1 text-xs"
                    defaultValue={formatSecondsToTimestamp(segment.end)}
                    onBlur={(e) => {
                        updateSegment({ end: timeToSeconds(e.target.value), id: segment.id });
                    }}
                />
                <div className="text-[0.6rem] block mt-2">
                    ({formatSecondsToTimestamp(Math.ceil(segment.end - segment.start))})
                </div>
            </td>

            <td className="px-4 py-1 align-top">
                <textarea
                    className="w-full h-full min-h-[4rem] border rounded p-2 text-sm resize-none whitespace-pre-wrap text-right"
                    defaultValue={segment.text}
                    dir="rtl"
                    onBlur={(e) => {
                        autoResize(e.currentTarget);
                        updateSegment({ id: segment.id, text: e.target.value });
                    }}
                    onSelect={(e) => {
                        const { selectionEnd, selectionStart } = e.currentTarget;
                        if (selectionStart !== selectionEnd) {
                            setSelectedToken(getFirstTokenForSelection(segment, selectionStart, selectionEnd));
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
    );
}
