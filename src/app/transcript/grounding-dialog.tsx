import { record } from 'nanolytics';
import {
    applyGroundTruthToSegment,
    formatSecondsToTimestamp,
    type GroundedSegment,
    updateSegmentWithGroundTruth,
} from 'paragrafs';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { preformatArabicText } from '@/lib/textUtils';
import type { Segment } from '@/stores/transcriptStore/types';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

export function GroundingDialog({ segment }: Readonly<{ segment: Segment }>) {
    const [groundedSegment, setGroundedSegment] = useState<GroundedSegment>(segment);
    const updateSegment = useTranscriptStore((state) => state.updateSegment);
    const selectAllSegments = useTranscriptStore((state) => state.selectAllSegments);

    return (
        <DialogContent className="flex max-h-[80vh] w-[80vw] flex-col sm:max-w-none">
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
                        record('OnPasteIntoGroundingTruth');

                        setTimeout(() => {
                            const textarea = e.target as HTMLTextAreaElement;
                            const fullText = preformatArabicText(textarea.value);
                            const newSegment = updateSegmentWithGroundTruth(segment, fullText);

                            setGroundedSegment(newSegment);
                        }, 0);
                    }}
                />
                {groundedSegment && (
                    <table className="w-full table-auto divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="w-8 px-2 py-1 text-left font-normal">Time</th>
                                <th aria-label="Text" className="px-4 py-1 text-right font-normal">
                                    Word
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {groundedSegment.tokens.map((s) => (
                                <tr className="space-y-1 px-2 py-1 align-top text-xs" key={`${s.start}_${s.end}`}>
                                    <td aria-label="Volume" className="w-36 px-2 py-1 text-left font-normal">
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
                            record('AcceptGroundTruth');

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
