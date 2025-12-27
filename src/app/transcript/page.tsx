'use client';

import { PaperclipIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useMemo } from 'react';

import { DataGate } from '@/components/data-gate';
import { useSessionRestore } from '@/components/hooks/use-session-restore';
import { JsonBrowseButton } from '@/components/json-browse-button';
import JsonDropZone from '@/components/json-drop-zone';
import { Checkbox } from '@/components/ui/checkbox';
import { STORAGE_KEYS } from '@/lib/constants';
import { loadFiles } from '@/lib/io';
import { adaptLegacyTranscripts } from '@/lib/legacy';
import { selectCurrentSegments } from '@/stores/transcriptStore/selectors';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';
import '@/lib/analytics';

import PartSelector from './part-selector';
import SegmentItem from './segment-item';
import TranscriptToolbar from './transcript-toolbar';
import UrlField from './url-field';

/**
 * Displays and manages transcript segments with selection and file import capabilities.
 */
export default function Transcript() {
    const isInitialized = useTranscriptStore((state) => state.selectedPart > 0);
    const initTranscripts = useTranscriptStore((state) => state.init);
    const hasGroundTruth = useTranscriptStore((state) => Boolean(state.groundTruth));
    const setGroundTruth = useTranscriptStore((state) => state.setGroundTruth);
    const selectAllSegments = useTranscriptStore((state) => state.selectAllSegments);
    const addTranscripts = useTranscriptStore((state) => state.addTranscripts);
    const segments = useTranscriptStore(selectCurrentSegments);

    const segmentItems = useMemo(() => {
        return (segments || []).map((segment) => (
            <SegmentItem key={segment.start.toString() + segment.end.toString()} segment={segment} />
        ));
    }, [segments]);

    // Session restore hook with adapter for legacy data
    useSessionRestore(STORAGE_KEYS.transcript, initTranscripts, 'RestoreTranscriptFromSession', adaptLegacyTranscripts);

    return (
        <DataGate
            dropZone={
                <JsonDropZone
                    onFiles={(fileNameToData) => {
                        const fileName = Object.keys(fileNameToData)[0];
                        record('LoadTranscriptFromFile', fileName);

                        document.title = fileName;
                        initTranscripts(adaptLegacyTranscripts(fileNameToData[fileName]));
                    }}
                />
            }
            hasData={isInitialized}
        >
            <div className="flex min-h-screen flex-col p-8 font-[family-name:var(--font-geist-sans)] sm:p-20">
                <div className="max-w flex w-full flex-col">
                    <div className="sticky top-0 z-20 flex items-center justify-between border-gray-200 border-b bg-white px-4 py-2">
                        <PartSelector />
                        <JsonBrowseButton
                            isMulti
                            onFilesSelected={async (files) => {
                                addTranscripts(await loadFiles(files));
                            }}
                        >
                            + Parts
                        </JsonBrowseButton>
                        {!hasGroundTruth && (
                            <JsonBrowseButton
                                aria-label="Set Ground Truth"
                                onFilesSelected={async (files) => {
                                    const result = await loadFiles(files);
                                    setGroundTruth(Object.values(result) as any);
                                }}
                            >
                                <PaperclipIcon />
                            </JsonBrowseButton>
                        )}
                        <TranscriptToolbar />
                    </div>

                    <div className="overflow-auto rounded border">
                        <table className="w-full table-auto divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="w-8 px-2 py-1 text-left">
                                        <Checkbox
                                            aria-label="Select all segments"
                                            onCheckedChange={(isSelected) => selectAllSegments(Boolean(isSelected))}
                                        />
                                    </th>
                                    <th aria-label="Timestamp" className="w-36 px-2 py-1 text-left">
                                        Time:
                                    </th>
                                    <th aria-label="Text" className="px-4 py-1 text-right">
                                        Text
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">{segmentItems}</tbody>
                            <tfoot>
                                <tr>
                                    <td className="px-4 py-2" colSpan={3}>
                                        <UrlField />
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </DataGate>
    );
}
