'use client';

import { formatSecondsToTimestamp } from 'paragrafs';
import React from 'react';

import { useTranscriptStore } from '@/stores/useTranscriptStore';

import DownloadButton from './download-button';
import { FormatDialog } from './format-dialog';
import { PreviewDialog } from './preview-dialog';
import { Button } from './ui/button';

export default function Toolbar() {
    const mergeSegments = useTranscriptStore((state) => state.mergeSegments);
    const groupAndSliceSegments = useTranscriptStore((state) => state.groupAndSliceSegments);
    const splitSegment = useTranscriptStore((state) => state.splitSegment);
    const removeSegments = useTranscriptStore((state) => state.deleteSelectedSegments);
    const selectedSegments = useTranscriptStore((state) => state.selectedSegments);
    const selectedToken = useTranscriptStore((state) => state.selectedToken);
    const sortedSegments = selectedSegments.toSorted((a, b) => a.start - b.start);

    return (
        <div className="flex space-x-2">
            {selectedSegments.length === 2 && (
                <Button onClick={mergeSegments}>
                    🔗 {formatSecondsToTimestamp(sortedSegments[0]!.start)} -{' '}
                    {formatSecondsToTimestamp(sortedSegments.at(-1)!.end)} (
                    {formatSecondsToTimestamp(Math.ceil(sortedSegments.at(-1)!.end - sortedSegments[0]!.start))})
                </Button>
            )}
            {selectedSegments.length > 0 && (
                <Button className="bg-red-200" onClick={removeSegments}>
                    🗑️
                </Button>
            )}
            {selectedToken && (
                <Button onClick={() => splitSegment()}>✂️ at {formatSecondsToTimestamp(selectedToken.start)}</Button>
            )}
            <FormatDialog>
                <Button variant="outline">⚙️</Button>
            </FormatDialog>
            <PreviewDialog>
                <Button className="bg-blue-500">Preview</Button>
            </PreviewDialog>
            <Button onClick={groupAndSliceSegments}>🔧</Button>
            <DownloadButton />
        </div>
    );
}
