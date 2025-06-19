'use client';

import { formatSecondsToTimestamp } from 'paragrafs';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

import SubmittableInput from './submittable-input';

type SearchResult = {
    start: number;
    text: string;
    volume: number;
};

/**
 * Displays a dialog for searching a transcript.
 *
 * The dialog presents the current transcript with configurable formatting, supports right-to-left text direction for Arabic content, and provides options to copy the text or translate it via an API.
 */
export function SearchDialog() {
    const [segmentResults, setSegmentResults] = useState<SearchResult[]>([]);
    const setSelectedPart = useTranscriptStore((state) => state.setSelectedPart)!;

    return (
        <DialogContent className="w-[80vw] sm:max-w-none max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>
                    <div className="flex items-center space-x-2">
                        <Label>Search Segments</Label>
                    </div>
                </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
                <SubmittableInput
                    dir="rtl"
                    name="query"
                    onSubmit={(query) => {
                        if (query) {
                            const { transcripts } = useTranscriptStore.getState();
                            const matched = Object.values(transcripts).flatMap((t) =>
                                t.segments
                                    .filter((s) => s.text.includes(query))
                                    .map((s) => ({ start: s.start, text: s.text, volume: t.volume })),
                            );

                            setSegmentResults(matched);
                        } else {
                            setSegmentResults([]);
                        }
                    }}
                />
                {segmentResults.length > 0 && (
                    <table className="w-full table-auto divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-1 w-8 text-left font-normal">Volume</th>
                                <th aria-label="Timestamp" className="px-2 py-1 w-36 text-left font-normal">
                                    Time:
                                </th>
                                <th aria-label="Text" className="px-4 py-1 text-right font-normal">
                                    Text
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {segmentResults.map((s) => (
                                <tr className="px-2 py-1 space-y-1 text-xs align-top" key={s.volume + '/' + s.start}>
                                    <td aria-label="Volume" className="px-2 py-1 w-36 text-left">
                                        <Button
                                            onClick={() => {
                                                setSelectedPart(s.volume);
                                            }}
                                            variant="outline"
                                        >
                                            {s.volume}
                                        </Button>
                                    </td>
                                    <td aria-label="Volume" className="px-2 py-1 w-36 text-left">
                                        {formatSecondsToTimestamp(s.start)}
                                    </td>
                                    <td aria-label="Text" className="px-4 py-1 text-right">
                                        {s.text}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </DialogContent>
    );
}
