import { afterEach, beforeEach, describe, expect, it, jest, mock } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';
import { resetTranscriptStoreState } from '@/test-utils/transcriptStore';

const record = jest.fn();
const toast = { success: jest.fn() };
const saveToOPFS = jest.fn();
const downloadFile = jest.fn();

mock.module('nanolytics', () => ({ record }));

mock.module('sonner', () => ({ toast }));

mock.module('@/components/ui/button', () => ({
    Button: ({ children, ...props }: any) => (
        <button type="button" {...props}>
            {children}
        </button>
    ),
}));

mock.module('@/components/ui/dialog-trigger', () => ({
    DialogTriggerButton: ({ children, onClick }: any) => (
        <button onClick={onClick} type="button">
            {children}
        </button>
    ),
}));

mock.module('paragrafs', () => ({
    formatSecondsToTimestamp: (seconds: number) => `00:00:${seconds.toString().padStart(2, '0')}`,
}));

mock.module('@/lib/transcriptUtils', () => ({ generateFormattedTranscriptFromState: () => 'formatted transcript' }));

mock.module('@/lib/legacy', () => ({ mapTranscriptsToLatestContract: () => ({ data: 'contract' }) }));

mock.module('@/lib/io', () => ({ saveToOPFS }));

mock.module('@/lib/domUtils', () => ({ downloadFile }));
mock.module('next/navigation', () => ({ usePathname: () => '/test-path', useRouter: () => ({ replace: jest.fn() }) }));

import TranscriptToolbar from './transcript-toolbar';

describe('TranscriptToolbar', () => {
    beforeEach(() => {
        resetTranscriptStoreState();
        record.mockReset();
        toast.success.mockReset();
        saveToOPFS.mockReset();
        downloadFile.mockReset();
    });

    afterEach(() => {
        cleanup();
        jest.restoreAllMocks();
        resetTranscriptStoreState();
    });

    it('provides merge and split actions when multiple segments are selected', () => {
        useTranscriptStore.setState({
            selectedSegments: [
                { end: 5, start: 0, text: 'a' },
                { end: 15, start: 10, text: 'b' },
            ],
            selectedToken: { start: 2 } as any,
        });
        const mergeSegmentsSpy = jest
            .spyOn(useTranscriptStore.getState(), 'mergeSegments')
            .mockImplementation(() => {});
        const splitSegmentSpy = jest.spyOn(useTranscriptStore.getState(), 'splitSegment').mockImplementation(() => {});

        render(<TranscriptToolbar />);

        fireEvent.click(screen.getByText(/🔗/));
        expect(mergeSegmentsSpy).toHaveBeenCalled();

        fireEvent.click(screen.getByText(/✂️ at/));
        expect(splitSegmentSpy).toHaveBeenCalled();
    });

    it('shows ground truth dialog trigger for a single selection', () => {
        useTranscriptStore.setState({ selectedSegments: [{ end: 5, start: 0, text: 'a' }] });

        render(<TranscriptToolbar />);

        fireEvent.click(screen.getByText('⚖️'));
        expect(record).toHaveBeenCalledWith('OpenGroundTruth');
    });

    it('handles destructive and completion actions', () => {
        useTranscriptStore.setState({ selectedSegments: [{ end: 5, start: 0, text: 'a' }] });
        const deleteSegmentsSpy = jest
            .spyOn(useTranscriptStore.getState(), 'deleteSelectedSegments')
            .mockImplementation(() => {});
        const markCompletedSpy = jest
            .spyOn(useTranscriptStore.getState(), 'markCompleted')
            .mockImplementation(() => {});

        render(<TranscriptToolbar />);

        fireEvent.click(screen.getAllByLabelText('Delete selected segments')[0]!);
        expect(deleteSegmentsSpy).toHaveBeenCalled();

        fireEvent.click(screen.getAllByLabelText('Mark selected segments as completed')[0]!);
        expect(markCompletedSpy).toHaveBeenCalled();
    });

    it('runs grouping and rebuild helpers', () => {
        const groupSpy = jest
            .spyOn(useTranscriptStore.getState(), 'groupAndSliceSegments')
            .mockImplementation(() => {});
        const rebuildSpy = jest
            .spyOn(useTranscriptStore.getState(), 'rebuildSegmentFromTokens')
            .mockImplementation(() => {});

        render(<TranscriptToolbar />);

        fireEvent.click(screen.getAllByText('🔧 Group & Slice Segments')[0]!);
        expect(groupSpy).toHaveBeenCalled();

        fireEvent.click(screen.getAllByText('♺ Rebuild Segment from Tokens')[0]!);
        expect(rebuildSpy).toHaveBeenCalled();
    });
});
