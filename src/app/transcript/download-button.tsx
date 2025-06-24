'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/domUtils';
import { mapTranscriptsToLatestContract } from '@/lib/legacy';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

/**
 * Renders a button that downloads the current transcripts as a formatted JSON file.
 *
 * When clicked, the button generates a JSON file containing the transcripts mapped to the latest contract format and initiates a download with a timestamped filename.
 */
export default function DownloadButton() {
    const transcripts = useTranscriptStore((state) => state.transcripts);
    const createdAt = useTranscriptStore((state) => state.createdAt);

    return (
        <Button
            className="bg-emerald-500"
            onClick={() => {
                downloadFile(
                    `${Date.now()}.json`,
                    JSON.stringify(mapTranscriptsToLatestContract(Object.values(transcripts), createdAt), null, 2),
                );
            }}
        >
            💾
        </Button>
    );
}
