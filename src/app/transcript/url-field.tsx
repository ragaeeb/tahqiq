'use client';

import { autoResize } from 'dyelight';
import { record } from 'nanolytics';

import { Textarea } from '@/components/ui/textarea';
import { selectCurrentTranscript } from '@/stores/transcriptStore/selectors';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

/**
 * Renders a textarea which has all the URLs that were used to source the ground truth of this transcript.
 */
export default function UrlField() {
    const transcript = useTranscriptStore(selectCurrentTranscript)!;
    const updateUrlsForTranscript = useTranscriptStore((state) => state.updateUrlsForTranscript);
    const mergedUrls = transcript.urls?.join('\n') || '';

    return (
        <Textarea
            className="w-full resize-none overflow-hidden"
            defaultValue={mergedUrls}
            key={transcript.volume.toString()}
            onBlur={(e) => {
                if (e.target.value !== mergedUrls) {
                    record('UpdateUrlsForTranscript');
                    autoResize(e.currentTarget);
                    updateUrlsForTranscript(Array.from(new Set(e.target.value.split('\n'))));
                }
            }}
            placeholder="URLs..."
            ref={(el) => {
                if (el) {
                    autoResize(el);
                }
            }}
            rows={1}
        />
    );
}
