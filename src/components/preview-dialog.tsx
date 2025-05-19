'use client';

import { isArabic } from '@flowdegree/arabic-strings';
import { formatSegmentsToTimestampedTranscript, markAndCombineSegments } from 'paragrafs';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { selectCurrentTranscript } from '@/stores/selectors';
import { useTranscriptStore } from '@/stores/useTranscriptStore';

import { Textarea } from './ui/textarea';

export function PreviewDialog({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const transcript = useTranscriptStore(selectCurrentTranscript)!;
    const formatOptions = useTranscriptStore((state) => state.formatOptions)!;
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const markedSegments = markAndCombineSegments(transcript.segments, {
            fillers: [],
            gapThreshold: formatOptions.silenceGapThreshold,
            hints: {},
            maxSecondsPerSegment: formatOptions.maxSecondsPerSegment,
            minWordsPerSegment: formatOptions.minWordsPerSegment,
        });
        const formatted = formatSegmentsToTimestampedTranscript(markedSegments, formatOptions.maxSecondsPerLine);
        setText(formatted.replace(/\n/g, '\n\n'));
    }, [transcript, formatOptions]);

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="w-[80vw] sm:max-w-none max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Preview</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto">
                    <Textarea
                        className="w-full h-full resize-none"
                        dir={isArabic(text) ? 'rtl' : undefined}
                        onChange={(e) => setText(e.target.value)}
                        value={text}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            onClick={() => {
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

                                setText(res.ok && data.text ? data.text : 'Unable to translate');
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                    >
                        Translate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
