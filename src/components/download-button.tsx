'use client';

import React from 'react';

import { useTranscriptStore } from '@/stores/useTranscriptStore';

import { Button } from './ui/button';

const downloadFile = (fileName: string, content: string, mimeType = 'text/plain') => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: mimeType });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
};

export default function DownloadButton() {
    const transcripts = useTranscriptStore((state) => state.transcripts);

    return (
        <Button
            className="bg-emerald-500"
            onClick={() => {
                downloadFile(`1.json`, JSON.stringify(transcripts, null, 2), 'application/json');
            }}
        >
            💾
        </Button>
    );
}
