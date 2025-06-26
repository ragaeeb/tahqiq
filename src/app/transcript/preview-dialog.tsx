'use client';

import { isArabic } from '@flowdegree/arabic-strings';
import { record } from 'nanolytics';
import {
    createHints,
    formatSecondsToTimestamp,
    formatSegmentsToTimestampedTranscript,
    markAndCombineSegments,
} from 'paragrafs';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { selectCurrentTranscript } from '@/stores/transcriptStore/selectors';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

/**
 * Displays a dialog for previewing, editing, copying, and translating a formatted transcript.
 *
 * The dialog presents the current transcript with configurable formatting, supports right-to-left text direction for Arabic content, and provides options to copy the text or translate it via an API.
 */
export function PreviewDialog() {
    const transcript = useTranscriptStore(selectCurrentTranscript)!;
    const formatOptions = useTranscriptStore((state) => state.formatOptions)!;
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGroupingBySegments, setIsGroupingBySegments] = useState(false);

    useEffect(() => {
        if (isGroupingBySegments) {
            const result = transcript.segments
                .map((s) => `${formatSecondsToTimestamp(s.start)}: ${s.text}`)
                .join('\n\n');
            setText(result);
        } else {
            const markedSegments = markAndCombineSegments(transcript.segments, {
                fillers: formatOptions.fillers.flatMap((token) => [token, token + '.', token + '؟']),
                gapThreshold: formatOptions.silenceGapThreshold,
                hints: createHints(...formatOptions.hints),
                maxSecondsPerSegment: formatOptions.maxSecondsPerSegment,
                minWordsPerSegment: formatOptions.minWordsPerSegment,
            });
            const formatted = formatSegmentsToTimestampedTranscript(markedSegments, formatOptions.maxSecondsPerLine);
            setText(formatted.replace(/\n/g, '\n\n'));
        }
    }, [transcript, formatOptions, isGroupingBySegments]);

    return (
        <DialogContent className="w-[80vw] sm:max-w-none max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={isGroupingBySegments}
                            id="groupBySegments"
                            onCheckedChange={(isSelected) => {
                                record('GroupTranscriptBySegments', isSelected.toString());
                                setIsGroupingBySegments(Boolean(isSelected));
                            }}
                        />
                        <Label htmlFor="groupBySegments">Group by Segments</Label>
                    </div>
                </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
                <Textarea
                    className="w-full h-full resize-none"
                    dir={isArabic(text) ? 'rtl' : undefined}
                    onChange={(e) => {
                        record('EditTranscriptInPreviewDialog');
                        setText(e.target.value);
                    }}
                    value={text}
                />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button
                        onClick={() => {
                            record('CopyTranscriptToClipboard');
                            navigator.clipboard.writeText(text);
                        }}
                        type="submit"
                    >
                        Copy to Clipboard
                    </Button>
                </DialogClose>
                <Button
                    className="bg-blue-500"
                    disabled={isLoading}
                    onClick={async () => {
                        record('TranslateTranscript');
                        setIsLoading(true);
                        try {
                            const res = await fetch('/api/translate', {
                                body: JSON.stringify({ text }),
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                method: 'POST',
                            });
                            const data = await res.json();
                            if (!res.ok) {
                                throw new Error(`Translation failed: ${data.error || 'Unknown error'}`);
                            }
                            if (!data.text) {
                                throw new Error('Received empty translation response');
                            }

                            record('TranscriptTranslationSuccess');
                            setText(data.text);
                        } catch (error) {
                            record('TranscriptTranslationFailure');

                            console.error('Translation error:', error);
                            setText(
                                `Translation failed: ${
                                    error instanceof Error ? error.message : 'Network or server error'
                                }`,
                            );
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                >
                    Translate
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
