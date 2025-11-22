import { act, render, screen } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, jest, mock } from 'bun:test';

import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';
import { resetTranscriptStoreState } from '@/test-utils/transcriptStore';

const record = jest.fn();

mock.module('nanolytics', () => ({
    record,
}));

mock.module('@/components/ui/dialog', () => ({
    DialogClose: ({ children }: any) => <>{children}</>,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h3>{children}</h3>,
}));

const applyGroundTruthToSegment = jest.fn((segment, text) => ({ ...segment, text }));
const updateSegmentWithGroundTruth = jest.fn((segment, text) => ({ ...segment, text, tokens: segment.tokens }));

mock.module('paragrafs', () => ({
    applyGroundTruthToSegment,
    formatSecondsToTimestamp: (value: number) => `${value}s`,
    updateSegmentWithGroundTruth,
}));

import { GroundingDialog } from './grounding-dialog';

const segment = {
    end: 10,
    start: 0,
    text: 'hello world',
    tokens: [
        { end: 1, isUnknown: false, start: 0, text: 'hello' },
        { end: 2, isUnknown: false, start: 1, text: 'world' },
    ],
};

let updateSegmentSpy: jest.Mock;
let selectAllSegmentsSpy: jest.Mock;

describe('GroundingDialog', () => {
    beforeEach(() => {
        resetTranscriptStoreState();
        updateSegmentSpy = jest
            .spyOn(useTranscriptStore.getState(), 'updateSegment')
            .mockImplementation(() => {});
        selectAllSegmentsSpy = jest
            .spyOn(useTranscriptStore.getState(), 'selectAllSegments')
            .mockImplementation(() => {});
    });

    afterEach(() => {
        updateSegmentSpy.mockRestore();
        selectAllSegmentsSpy.mockRestore();
        resetTranscriptStoreState();
    });

    it('saves grounded segments', async () => {
        const user = userEvent.setup();
        await act(async () => {
            render(<GroundingDialog segment={segment as any} />);
        });

        await act(async () => {
            await user.click(screen.getByText('✔️ Save'));
        });

        expect(applyGroundTruthToSegment).toHaveBeenCalledWith(segment, segment.text);
        expect(updateSegmentSpy).toHaveBeenCalledWith(segment.start, expect.objectContaining({ text: segment.text }), true);
        expect(selectAllSegmentsSpy).toHaveBeenCalledWith(false);
        expect(record).toHaveBeenCalledWith('AcceptGroundTruth');
    });
});
