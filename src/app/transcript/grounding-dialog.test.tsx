import { render, screen } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, jest, mock } from 'bun:test';

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

const storeState: any = {
    selectAllSegments: jest.fn(),
    updateSegment: jest.fn(),
};

mock.module('@/stores/transcriptStore/useTranscriptStore', () => ({
    useTranscriptStore: (selector: any) => selector(storeState),
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

describe('GroundingDialog', () => {
    it('saves grounded segments', async () => {
        const user = userEvent.setup();
        render(<GroundingDialog segment={segment as any} />);

        await user.click(screen.getByText('✔️ Save'));

        expect(applyGroundTruthToSegment).toHaveBeenCalledWith(segment, segment.text);
        expect(storeState.updateSegment).toHaveBeenCalled();
        expect(storeState.selectAllSegments).toHaveBeenCalledWith(false);
        expect(record).toHaveBeenCalledWith('AcceptGroundTruth');
    });
});
