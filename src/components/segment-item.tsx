'use client';

import clsx from 'clsx';
import { formatSecondsToTimestamp, getFirstTokenForSelection } from 'paragrafs';
import React from 'react';

import type { Segment } from '@/stores/types';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { pasteText } from '@/lib/domUtils';
import { preformatArabicText } from '@/lib/textUtils';
import { timeToSeconds } from '@/lib/time';
import { useTranscriptStore } from '@/stores/useTranscriptStore';

/**
 * Renders a table row for a transcript segment with editable start/end times, text, and selection controls.
 *
 * Allows users to select the segment, edit its timing and text, and interact with the text area for advanced behaviors such as right-to-left input, auto-resizing, and custom paste handling for Arabic text.
 *
 * @param segment - The transcript segment to display and edit.
 */
function SegmentItem({ segment }: { segment: Segment }) {
    const { setSelectedToken, toggleSegmentSelection, updateSegment } = useTranscriptStore.getInitialState();
    const isSelected = useTranscriptStore((state) => state.selectedSegments.includes(segment));

    const autoResize = (textArea: HTMLTextAreaElement) => {
        textArea.style.height = 'auto';
        textArea.style.height = `${textArea.scrollHeight}px`;
    };

    return (
        <tr className={clsx(segment.status === 'done' && 'bg-green-50')}>
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
                            updateSegment(segment.start, { start });
                        }
                    }}
                />
                <Input
                    defaultValue={formatSecondsToTimestamp(segment.end)}
                    onBlur={(e) => {
                        const end = timeToSeconds(e.target.value);

                        if (end !== segment.end) {
                            updateSegment(segment.start, { end });
                        }
                    }}
                    title={formatSecondsToTimestamp(Math.ceil(segment.end - segment.start))}
                />
            </td>

            <td className="px-4 py-1 align-top">
                <Textarea
                    className={segment.status === 'done' ? 'bg-emerald-100' : undefined}
                    defaultValue={segment.text}
                    dir="rtl"
                    onBlur={(e) => {
                        if (e.target.value !== segment.text) {
                            autoResize(e.currentTarget);
                            updateSegment(segment.start, { text: e.target.value });
                        }
                    }}
                    onPaste={(e) => {
                        e.preventDefault();

                        const text = preformatArabicText(e.clipboardData.getData('text'));
                        pasteText(e.target as HTMLTextAreaElement, text);
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
