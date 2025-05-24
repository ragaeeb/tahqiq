'use client';

import { useMemo } from 'react';

import { adaptLegacyTranscripts } from '@/lib/legacy';
import { selectCurrentSegments } from '@/stores/selectors';
import { useTranscriptStore } from '@/stores/useTranscriptStore';

import { JsonBrowseButton } from './json-browse-button';
import JsonDropZone from './json-drop-zone';
import PartSelector from './part-selector';
import SegmentItem from './segment-item';
import Toolbar from './toolbar';
import { Checkbox } from './ui/checkbox';
import UrlField from './url-field';

/**
 * Displays and manages transcript segments with selection and file import capabilities.
 *
 * Renders a transcript viewer that allows users to import transcript files, select transcript parts, and interact with individual segments. If no transcript is loaded, prompts the user to upload a JSON transcript file.
 */
export default function Transcript() {
    const isInitialized = useTranscriptStore((state) => state.selectedPart > 0);
    const initTranscripts = useTranscriptStore((state) => state.init);
    const selectAllSegments = useTranscriptStore((state) => state.selectAllSegments);
    const addTranscripts = useTranscriptStore((state) => state.addTranscripts);
    const segments = useTranscriptStore(selectCurrentSegments);

    const segmentItems = useMemo(() => {
        return (segments || []).map((segment) => (
            <SegmentItem key={segment.start.toString() + segment.end.toString()} segment={segment} />
        ));
    }, [segments]);

    if (!isInitialized) {
        return (
            <div className="flex flex-col w-full max-w">
                <JsonDropZone onFile={(file) => initTranscripts(adaptLegacyTranscripts(file))} />
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full max-w">
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <PartSelector />
                <JsonBrowseButton onFilesSelected={addTranscripts}>+ Parts</JsonBrowseButton>
                <Toolbar />
            </div>

            <div className="overflow-auto border rounded">
                <table className="w-full table-auto divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-2 py-1 w-8 text-left">
                                <Checkbox
                                    aria-label="Select all segments"
                                    onCheckedChange={(isSelected) => selectAllSegments(Boolean(isSelected))}
                                />
                            </th>
                            <th aria-label="Timestamp" className="px-2 py-1 w-36 text-left">
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
    );
}
