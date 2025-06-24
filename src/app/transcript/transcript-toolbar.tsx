'use client';

import { formatSecondsToTimestamp } from 'paragrafs';
import React from 'react';

import { Button } from '@/components/ui/button';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

import DownloadButton from './download-button';
import { FormatDialog } from './format-dialog';
import { GroundingDialog } from './grounding-dialog';
import { PreviewDialog } from './preview-dialog';
import { SearchDialog } from './search-dialog';

/**
 * Renders a toolbar for managing transcript segments with actions such as merging, splitting, grouping, marking as completed, deleting, previewing, formatting, and downloading.
 *
 * The toolbar displays context-sensitive controls based on the current selection of segments or tokens, enabling efficient transcript editing and management.
 */
export default function TranscriptToolbar() {
    const mergeSegments = useTranscriptStore((state) => state.mergeSegments);
    const groupAndSliceSegments = useTranscriptStore((state) => state.groupAndSliceSegments);
    const rebuildSegmentFromTokens = useTranscriptStore((state) => state.rebuildSegmentFromTokens);
    const splitSegment = useTranscriptStore((state) => state.splitSegment);
    const markCompleted = useTranscriptStore((state) => state.markCompleted);
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
            {selectedSegments.length === 1 && (
                <DialogTriggerButton
                    className="bg-gray-100"
                    renderContent={() => <GroundingDialog segment={selectedSegments[0]!} />}
                >
                    ⚖️
                </DialogTriggerButton>
            )}
            {selectedSegments.length > 0 && (
                <Button aria-label="Delete selected segments" className="bg-red-200" onClick={removeSegments}>
                    🗑️
                </Button>
            )}
            {selectedSegments.length > 0 && (
                <Button aria-label="Mark selected segments as completed" onClick={markCompleted}>
                    ✅
                </Button>
            )}
            {selectedToken && (
                <Button onClick={() => splitSegment()}>✂️ at {formatSecondsToTimestamp(selectedToken.start)}</Button>
            )}

            <DialogTriggerButton
                aria-label="Formatting options"
                renderContent={() => <FormatDialog />}
                variant="outline"
            >
                ⚙️
            </DialogTriggerButton>
            <DialogTriggerButton aria-label="Preview" className="bg-blue-500" renderContent={() => <PreviewDialog />}>
                Preview
            </DialogTriggerButton>
            <DialogTriggerButton aria-label="Search" renderContent={() => <SearchDialog />} variant="outline">
                🔍
            </DialogTriggerButton>
            <Button aria-label="Group and slice segments" onClick={groupAndSliceSegments}>
                🔧 Group & Slice Segments
            </Button>
            <Button
                aria-label="Rebuild Segments from Tokens"
                className="bg-orange-500"
                onClick={rebuildSegmentFromTokens}
            >
                ♺ Rebuild Segment from Tokens
            </Button>
            <DownloadButton />
        </div>
    );
}
