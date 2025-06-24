'use client';

import {
    applyGroundTruthToSegment,
    formatSecondsToTimestamp,
    type GroundedSegment,
    updateSegmentWithGroundTruth,
} from 'paragrafs';
import { useState } from 'react';

import type { Segment } from '@/stores/transcriptStore/types';

import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { pasteText } from '@/lib/domUtils';
import { preformatArabicText } from '@/lib/textUtils';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

export function GroundingDialog({
    segment,
}: Readonly<{
    segment: Segment;
}>) {
    const [groundedSegment, setGroundedSegment] = useState<GroundedSegment>();
    const updateSegment = useTranscriptStore((state) => state.updateSegment);
    const selectAllSegments = useTranscriptStore((state) => state.selectAllSegments);

    return (
        <DialogContent className="w-[80vw] sm:max-w-none max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>
                    <div className="flex items-center space-x-2">
                        <Label>Set Ground Truth</Label>
                    </div>
                </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
                <Textarea
                    defaultValue={segment.text}
                    dir="rtl"
                    onPaste={(e) => {
                        e.preventDefault();
                        const text = preformatArabicText(e.clipboardData.getData('text'));

                        const newSegment = updateSegmentWithGroundTruth(segment, text);
                        setGroundedSegment(newSegment);
                        pasteText(e.target as HTMLTextAreaElement, text);
                    }}
                />
                {groundedSegment && (
                    <table className="w-full table-auto divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-1 w-8 text-left font-normal">Time</th>
                                <th aria-label="Text" className="px-4 py-1 text-right font-normal">
                                    Word
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {groundedSegment.tokens.map((s) => (
                                <tr className="px-2 py-1 space-y-1 text-xs align-top" key={s.start}>
                                    <td aria-label="Volume" className="px-2 py-1 w-36 text-left font-normal">
                                        {formatSecondsToTimestamp(s.start)}
                                    </td>
                                    <td
                                        aria-label="Text"
                                        className={`px-4 py-1 text-right font-normal ${s.isUnknown && 'bg-red-100'}`}
                                    >
                                        {s.text}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button
                        disabled={!groundedSegment}
                        onClick={() => {
                            const grounded = applyGroundTruthToSegment(segment, groundedSegment!.text);
                            updateSegment(segment.start, grounded, true);
                            selectAllSegments(false);
                        }}
                        type="submit"
                    >
                        ✔️ Save
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    );
}
