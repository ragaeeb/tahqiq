'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { TagInput } from '@/components/ui/tag-input';
import { DEFAULT_FILLER_WORDS, DEFAULT_HINTS } from '@/lib/constants';
import { useTranscriptStore } from '@/stores/useTranscriptStore';

export function FormatDialog({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [maxSecondsPerSegment, setMaxSecondsPerSegment] = useState([240]);
    const [maxSecondsPerLine, setMaxSecondsPerLine] = useState([30]);
    const [minWordsPerSegment, setMinWordsPerSegment] = useState([10]);
    const [silenceGapThreshold, setSilenceGapThreshold] = useState([2]);
    const [flipPunctuation, setFlipPunctuation] = useState(true);
    const [hints, setHints] = useState(DEFAULT_HINTS);
    const [fillers, setFillers] = useState(DEFAULT_FILLER_WORDS);
    const groupAndSliceSegments = useTranscriptStore((state) => state.groupAndSliceSegments);

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="w-full">
                <DialogHeader>
                    <DialogTitle>Formatting Options</DialogTitle>
                    <DialogDescription>Edit these values to change how the segments get chunked.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={flipPunctuation}
                            id="flipPunctuation"
                            onCheckedChange={(isSelected) => setFlipPunctuation(Boolean(isSelected))}
                        />
                        <Label htmlFor="flipPunctuation">Flip English to Arabic Punctuation</Label>
                    </div>

                    <Label className="text-right">Max Seconds Per Segment: {maxSecondsPerSegment}s</Label>
                    <Slider
                        max={300}
                        min={10}
                        onValueChange={setMaxSecondsPerSegment}
                        step={10}
                        value={maxSecondsPerSegment}
                    />

                    <Label className="text-right">Minimum Words Per Segment: {minWordsPerSegment}</Label>
                    <Slider
                        max={30}
                        min={1}
                        onValueChange={setMinWordsPerSegment}
                        step={1}
                        value={minWordsPerSegment}
                    />

                    <Label className="text-right">Max Seconds Per Line: {maxSecondsPerLine}</Label>
                    <Slider
                        max={300}
                        min={10}
                        onValueChange={setMaxSecondsPerLine}
                        step={10}
                        value={maxSecondsPerLine}
                    />

                    <Label className="text-right">Silence Gap Threshold: {silenceGapThreshold}</Label>
                    <Slider
                        max={5}
                        min={0.5}
                        onValueChange={setSilenceGapThreshold}
                        step={0.1}
                        value={silenceGapThreshold}
                    />

                    <Label className="text-right">Hints:</Label>
                    <TagInput dir="rtl" onChange={setHints} value={hints} />
                    <Label className="text-right">Fillers:</Label>
                    <TagInput dir="rtl" onChange={setFillers} value={fillers} />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            onClick={() => {
                                groupAndSliceSegments({
                                    fillers,
                                    flipPunctuation,
                                    hints,
                                    maxSecondsPerLine: maxSecondsPerLine[0]!,
                                    maxSecondsPerSegment: maxSecondsPerSegment[0]!,
                                    minWordsPerSegment: minWordsPerSegment[0]!,
                                    silenceGapThreshold: silenceGapThreshold[0]!,
                                });
                            }}
                            type="submit"
                        >
                            Apply
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
