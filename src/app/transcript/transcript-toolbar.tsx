'use client';

import { BotIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { formatSecondsToTimestamp } from 'paragrafs';
import React from 'react';

import { Button } from '@/components/ui/button';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { TRANSLATE_DRAFT_TRANSCRIPT_PROMPT } from '@/lib/constants';
import { generateFormattedTranscriptFromState } from '@/lib/transcriptUtils';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

import { TranslateDialog } from '../book/translate-dialog';
import DownloadButton from './download-button';
import { FormatDialog } from './format-dialog';
import { GroundingDialog } from './grounding-dialog';
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
                <Button
                    onClick={() => {
                        record('MergeTranscripts');
                        mergeSegments();
                    }}
                >
                    🔗 {formatSecondsToTimestamp(sortedSegments[0]!.start)} -{' '}
                    {formatSecondsToTimestamp(sortedSegments.at(-1)!.end)} (
                    {formatSecondsToTimestamp(Math.ceil(sortedSegments.at(-1)!.end - sortedSegments[0]!.start))})
                </Button>
            )}
            {selectedSegments.length === 1 && (
                <DialogTriggerButton
                    className="bg-gray-100"
                    onClick={() => {
                        record('OpenGroundTruth');
                    }}
                    renderContent={() => <GroundingDialog segment={selectedSegments[0]!} />}
                >
                    ⚖️
                </DialogTriggerButton>
            )}
            {selectedSegments.length > 0 && (
                <Button
                    aria-label="Delete selected segments"
                    className="bg-red-200"
                    onClick={() => {
                        record('RemoveSelectedSegments');
                        removeSegments();
                    }}
                >
                    🗑️
                </Button>
            )}
            {selectedSegments.length > 0 && (
                <Button
                    aria-label="Mark selected segments as completed"
                    onClick={() => {
                        record('MarkTranscriptsCompleted', selectedSegments.length.toString());
                        markCompleted();
                    }}
                >
                    ✅
                </Button>
            )}
            {selectedToken && (
                <Button
                    onClick={() => {
                        record('SplitSegment');
                        splitSegment();
                    }}
                >
                    ✂️ at {formatSecondsToTimestamp(selectedToken.start)}
                </Button>
            )}

            <DialogTriggerButton
                aria-label="Formatting options"
                onClick={() => {
                    record('TranscriptFormatSettings');
                }}
                renderContent={() => <FormatDialog />}
                variant="outline"
            >
                ⚙️
            </DialogTriggerButton>
            <DialogTriggerButton
                aria-label="Preview"
                className="bg-blue-500"
                onClick={() => {
                    record('OpenTranscriptPreview');
                }}
                renderContent={() => {
                    const state = useTranscriptStore.getState();
                    const defaultText = generateFormattedTranscriptFromState(state);

                    return (
                        <TranslateDialog defaultPrompt={TRANSLATE_DRAFT_TRANSCRIPT_PROMPT} defaultText={defaultText} />
                    );
                }}
            >
                <BotIcon /> AI Translate
            </DialogTriggerButton>
            <DialogTriggerButton
                aria-label="Search"
                onClick={() => {
                    record('OpenTranscriptSearch');
                }}
                renderContent={() => <SearchDialog />}
                variant="outline"
            >
                🔍
            </DialogTriggerButton>
            <Button
                aria-label="Group and slice segments"
                onClick={() => {
                    record('GroupAndSliceSegments');
                    groupAndSliceSegments();
                }}
            >
                🔧 Group & Slice Segments
            </Button>
            <Button
                aria-label="Rebuild Segments from Tokens"
                className="bg-orange-500"
                onClick={() => {
                    record('RebuildSegmentFromTokens');
                    rebuildSegmentFromTokens();
                }}
            >
                ♺ Rebuild Segment from Tokens
            </Button>
            <DownloadButton />
        </div>
    );
}
