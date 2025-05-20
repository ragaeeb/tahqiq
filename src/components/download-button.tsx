'use client';

import React from 'react';

import { downloadFile } from '@/lib/domUtils';
import { mapTranscriptsToLatestContract } from '@/lib/legacy';
import { useTranscriptStore } from '@/stores/useTranscriptStore';

import { Button } from './ui/button';

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
