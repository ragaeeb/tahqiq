'use client';

import clsx from 'clsx';
import { formatSecondsToTimestamp, getFirstTokenForSelection } from 'paragrafs';
import React from 'react';

import type { Segment } from '@/stores/types';

import { timeToSeconds } from '@/lib/time';
import { useTranscriptStore } from '@/stores/useTranscriptStore';

import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

function SegmentItem({ segment }: { segment: Segment }) {
    const { setSelectedToken, toggleSegmentSelection, updateSegment } = useTranscriptStore.getInitialState();
    const isSelected = useTranscriptStore((state) => state.selectedSegments.includes(segment));

    const autoResize = (textArea: HTMLTextAreaElement) => {
        textArea.style.height = 'auto';
        textArea.style.height = `${textArea.scrollHeight}px`;
    };

    return (
        <tr className={clsx(segment.status === 'done' && 'bg-green-50')} key={segment.id}>
            <td className="px-2 py-1 align-top">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(isSelected) => toggleSegmentSelection(segment, Boolean(isSelected))}
                />
            </td>

            <td className="px-2 py-1 space-y-1 text-xs align-top">
                <Input
                    className="text-xs"
                    defaultValue={formatSecondsToTimestamp(segment.start)}
                    onBlur={(e) => {
                        const start = timeToSeconds(e.target.value);

                        if (start !== segment.start) {
                            updateSegment({ id: segment.id, start });
                        }
                    }}
                />
                <Input
                    defaultValue={formatSecondsToTimestamp(segment.end)}
                    onBlur={(e) => {
                        const end = timeToSeconds(e.target.value);

                        if (end !== segment.end) {
                            updateSegment({ end, id: segment.id });
                        }
                    }}
                    title={formatSecondsToTimestamp(Math.ceil(segment.end - segment.start))}
                />
            </td>

            <td className="px-4 py-1 align-top">
                <Textarea
                    defaultValue={segment.text}
                    dir="rtl"
                    onBlur={(e) => {
                        if (e.target.value !== segment.text) {
                            autoResize(e.currentTarget);
                            updateSegment({ id: segment.id, text: e.target.value });
                        }
                    }}
                    onSelect={(e) => {
                        const { selectionEnd, selectionStart } = e.currentTarget;

                        setSelectedToken(
                            selectionStart !== selectionEnd
                                ? getFirstTokenForSelection(segment, selectionStart, selectionEnd)
                                : null,
                        );
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

export default React.memo(SegmentItem);
