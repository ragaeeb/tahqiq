import { record } from 'nanolytics';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { TagInput } from '@/components/ui/tag-input';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

/**
 * Renders a dialog interface for editing transcript formatting options.
 *
 * Displays controls for adjusting segment timing, word count, punctuation flipping, hints, and fillers. When the user applies changes, the updated formatting options are saved to the global transcript store.
 */
export function FormatDialog() {
    const formatOptions = useTranscriptStore((state) => state.formatOptions);
    const setFormattingOptions = useTranscriptStore((state) => state.setFormattingOptions);
    const [maxSecondsPerSegment, setMaxSecondsPerSegment] = useState([formatOptions.maxSecondsPerSegment]);
    const [maxSecondsPerLine, setMaxSecondsPerLine] = useState([formatOptions.maxSecondsPerLine]);
    const [minWordsPerSegment, setMinWordsPerSegment] = useState([formatOptions.minWordsPerSegment]);
    const [silenceGapThreshold, setSilenceGapThreshold] = useState([formatOptions.silenceGapThreshold]);
    const [flipPunctuation, setFlipPunctuation] = useState(formatOptions.flipPunctuation);
    const [hints, setHints] = useState(formatOptions.hints);
    const [fillers, setFillers] = useState(formatOptions.fillers);

    return (
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
                        onCheckedChange={(isSelected) => {
                            record('TranscriptFlipPuncutation');
                            setFlipPunctuation(Boolean(isSelected));
                        }}
                    />
                    <Label htmlFor="flipPunctuation">Flip English to Arabic Punctuation</Label>
                </div>

                <Label className="text-right">Max Seconds Per Segment: {maxSecondsPerSegment}s</Label>
                <Slider
                    max={300}
                    min={10}
                    onValueChange={(value) => {
                        record('MaxSecondsPerSegment', value.toString());
                        setMaxSecondsPerSegment(value);
                    }}
                    step={10}
                    value={maxSecondsPerSegment}
                />

                <Label className="text-right">Minimum Words Per Segment: {minWordsPerSegment}</Label>
                <Slider
                    max={30}
                    min={1}
                    onValueChange={(value) => {
                        record('MinWordsPerSegment', value.toString());
                        setMinWordsPerSegment(value);
                    }}
                    step={1}
                    value={minWordsPerSegment}
                />

                <Label className="text-right">Max Seconds Per Line: {maxSecondsPerLine}</Label>
                <Slider
                    max={300}
                    min={10}
                    onValueChange={(value) => {
                        record('MaxSecondsPerLine', value.toString());
                        setMaxSecondsPerLine(value);
                    }}
                    step={10}
                    value={maxSecondsPerLine}
                />

                <Label className="text-right">Silence Gap Threshold: {silenceGapThreshold}</Label>
                <Slider
                    max={5}
                    min={0.5}
                    onValueChange={(value) => {
                        record('SilenceGapThreshold', value.toString());
                        setSilenceGapThreshold(value);
                    }}
                    step={0.1}
                    value={silenceGapThreshold}
                />

                <Label className="text-right">Hints:</Label>
                <TagInput
                    dir="rtl"
                    onChange={(value) => {
                        record('Hints', value.toString());
                        setHints(value);
                    }}
                    value={hints}
                />
                <Label className="text-right">Fillers:</Label>
                <TagInput
                    dir="rtl"
                    onChange={(value) => {
                        record('Fillers', value.toString());
                        setFillers(value);
                    }}
                    value={fillers}
                />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button
                        onClick={() => {
                            record('ApplyFormattingOptions');

                            setFormattingOptions({
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
    );
}
