import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';

import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';
import { resetTranscriptStoreState } from '@/test-utils/transcriptStore';

const record = jest.fn();

mock.module('nanolytics', () => ({
    record,
}));

mock.module('@/components/json-drop-zone', () => ({
    default: ({ description }: any) => <div data-testid="drop-zone">{description || 'drop zone'}</div>,
}));

mock.module('@/components/json-browse-button', () => ({
    JsonBrowseButton: ({ children, onFilesSelected }: any) => (
        <button onClick={() => onFilesSelected?.([])} type="button">
            {children}
        </button>
    ),
}));

mock.module('@/components/version-footer', () => ({
    default: () => <footer>version</footer>,
}));

mock.module('./part-selector', () => ({
    default: () => <div>part-selector</div>,
}));

mock.module('./segment-item', () => ({
    default: ({ segment }: any) => (
        <tr data-testid="segment-row">
            <td colSpan={3}>{segment.text}</td>
        </tr>
    ),
}));

mock.module('./url-field', () => ({
    default: () => <div>url-field</div>,
}));

mock.module('@/lib/io', () => ({
    loadCompressed: () => Promise.resolve(undefined),
    loadFiles: async () => ({}),
}));

mock.module('@/lib/legacy', () => ({
    adaptLegacyTranscripts: (value: any) => value,
}));

import TranscriptPage from './page';

describe('Transcript page', () => {
    beforeEach(() => {
        resetTranscriptStoreState();
        record.mockReset();
    });

    it('prompts for transcript upload when not initialized', () => {
        render(<TranscriptPage />);
        expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
    });

    it('renders transcript table once initialized', () => {
        act(() => {
            useTranscriptStore.setState({
                selectedPart: 1,
                transcripts: {
                    1: {
                        segments: [{ end: 5, start: 0, text: 'Segment text' }],
                        timestamp: new Date(),
                        volume: 1,
                    },
                },
            });
        });

        const selectAllSegmentsSpy = jest
            .spyOn(useTranscriptStore.getState(), 'selectAllSegments')
            .mockImplementation(() => {});

        render(<TranscriptPage />);

        expect(screen.getByText('part-selector')).toBeInTheDocument();
        expect(screen.getByTestId('segment-row')).toHaveTextContent('Segment text');

        const selectAll = screen.getByLabelText('Select all segments');
        fireEvent.click(selectAll);
        expect(selectAllSegmentsSpy).toHaveBeenCalledWith(true);

        selectAllSegmentsSpy.mockRestore();
    });
});
