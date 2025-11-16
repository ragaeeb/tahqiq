import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';

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
    default: ({ segment }: any) => <tr data-testid="segment-row">{segment.text}</tr>,
}));

mock.module('./transcript-toolbar', () => ({
    default: () => <div>toolbar</div>,
}));

mock.module('./url-field', () => ({
    default: () => <div>url-field</div>,
}));


mock.module('@/stores/transcriptStore/selectors', () => ({
    selectCurrentSegments: (state: any) => state.currentSegments,
}));

mock.module('@/lib/io', () => ({
    loadCompressed: () => Promise.resolve(undefined),
    loadFiles: async () => ({}),
}));

mock.module('@/lib/legacy', () => ({
    adaptLegacyTranscripts: (value: any) => value,
}));

const storeState: any = {
    addTranscripts: jest.fn(),
    currentSegments: [],
    groundTruth: null,
    init: jest.fn(),
    selectedPart: 0,
    selectAllSegments: jest.fn(),
    setGroundTruth: jest.fn(),
};

const useTranscriptStore = (selector: any) => selector(storeState);
useTranscriptStore.getState = () => storeState;

mock.module('@/stores/transcriptStore/useTranscriptStore', () => ({
    useTranscriptStore,
}));

import TranscriptPage from './page';

describe('Transcript page', () => {
    beforeEach(() => {
        Object.keys(storeState).forEach((key) => {
            if (typeof storeState[key] === 'function') {
                storeState[key] = jest.fn();
            }
        });
        storeState.selectedPart = 0;
        storeState.currentSegments = [];
        storeState.groundTruth = null;
        record.mockReset();
    });

    it('prompts for transcript upload when not initialized', () => {
        render(<TranscriptPage />);
        expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
    });

    it('renders transcript table once initialized', () => {
        storeState.selectedPart = 1;
        storeState.currentSegments = [{ end: 5, start: 0, text: 'Segment text' }];

        render(<TranscriptPage />);

        expect(screen.getByText('part-selector')).toBeInTheDocument();
        expect(screen.getByTestId('segment-row')).toHaveTextContent('Segment text');

        const selectAll = screen.getByLabelText('Select all segments');
        fireEvent.click(selectAll);
        expect(storeState.selectAllSegments).toHaveBeenCalledWith(true);
    });
});
