import { SaveIcon } from 'lucide-react';
import { record } from 'nanolytics';
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
    return (
        <Button
            className="bg-emerald-500"
            onClick={() => {
                const name = prompt('Enter output file name');

                if (name) {
                    record('DownloadTranscript', name);

                    downloadFile(
                        name.endsWith('.json') ? name : `${name}.json`,
                        JSON.stringify(mapTranscriptsToLatestContract(useTranscriptStore.getState()), null, 2),
                    );
                }
            }}
        >
            <SaveIcon />
        </Button>
    );
}
