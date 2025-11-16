import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, jest, mock } from 'bun:test';

const record = jest.fn();
const toast = { success: jest.fn() };
const saveCompressed = jest.fn();
const downloadFile = jest.fn();

mock.module('nanolytics', () => ({
    record,
}));

mock.module('sonner', () => ({
    toast,
}));

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

mock.module('@/lib/transcriptUtils', () => ({
    generateFormattedTranscriptFromState: () => 'formatted transcript',
}));

mock.module('@/lib/legacy', () => ({
    mapTranscriptsToLatestContract: () => ({ data: 'contract' }),
}));

mock.module('@/lib/io', () => ({
    saveCompressed,
}));

mock.module('@/lib/domUtils', () => ({
    downloadFile,
}));

const storeState: any = {
    deleteSelectedSegments: jest.fn(),
    groupAndSliceSegments: jest.fn(),
    markCompleted: jest.fn(),
    mergeSegments: jest.fn(),
    rebuildSegmentFromTokens: jest.fn(),
    reset: jest.fn(),
    selectedSegments: [],
    selectedToken: null,
    splitSegment: jest.fn(),
    transcripts: {},
};

const useTranscriptStore = (selector: any) => selector(storeState);
useTranscriptStore.getState = () => storeState;

mock.module('@/stores/transcriptStore/useTranscriptStore', () => ({
    useTranscriptStore,
}));

import TranscriptToolbar from './transcript-toolbar';

describe('TranscriptToolbar', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        Object.keys(storeState).forEach((key) => {
            if (typeof storeState[key] === 'function') {
                storeState[key] = jest.fn();
            }
        });
        storeState.selectedSegments = [];
        storeState.selectedToken = null;
        record.mockReset();
        toast.success.mockReset();
        saveCompressed.mockReset();
        downloadFile.mockReset();
    });

    it('provides merge and split actions when multiple segments are selected', () => {
        storeState.selectedSegments = [
            { end: 5, start: 0, text: 'a' },
            { end: 15, start: 10, text: 'b' },
        ];
        storeState.selectedToken = { start: 2 };

        render(<TranscriptToolbar />);

        fireEvent.click(screen.getByText(/🔗/));
        expect(storeState.mergeSegments).toHaveBeenCalled();

        fireEvent.click(screen.getByText(/✂️ at/));
        expect(storeState.splitSegment).toHaveBeenCalled();
    });

    it('shows ground truth dialog trigger for a single selection', () => {
        storeState.selectedSegments = [{ end: 5, start: 0, text: 'a' }];

        render(<TranscriptToolbar />);

        fireEvent.click(screen.getByText('⚖️'));
        expect(record).toHaveBeenCalledWith('OpenGroundTruth');
    });

    it('handles destructive and completion actions', () => {
        storeState.selectedSegments = [{ end: 5, start: 0, text: 'a' }];
        storeState.deleteSelectedSegments = jest.fn();
        storeState.markCompleted = jest.fn();

        render(<TranscriptToolbar />);

        fireEvent.click(screen.getAllByLabelText('Delete selected segments')[0]!);
        expect(storeState.deleteSelectedSegments).toHaveBeenCalled();

        fireEvent.click(screen.getAllByLabelText('Mark selected segments as completed')[0]!);
        expect(storeState.markCompleted).toHaveBeenCalled();
    });

    it('runs grouping and rebuild helpers', () => {
        storeState.groupAndSliceSegments = jest.fn();
        storeState.rebuildSegmentFromTokens = jest.fn();
        render(<TranscriptToolbar />);

        fireEvent.click(screen.getAllByText('🔧 Group & Slice Segments')[0]!);
        expect(storeState.groupAndSliceSegments).toHaveBeenCalled();

        fireEvent.click(screen.getAllByText('♺ Rebuild Segment from Tokens')[0]!);
        expect(storeState.rebuildSegmentFromTokens).toHaveBeenCalled();
    });
});
