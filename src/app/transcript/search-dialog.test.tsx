import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';

const record = jest.fn();

mock.module('nanolytics', () => ({
    record,
}));

mock.module('@/components/ui/dialog', () => ({
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h4>{children}</h4>,
}));

const storeState: any = {
    setSelectedPart: jest.fn(),
    transcripts: {
        1: { segments: [{ start: 10, text: 'match me' }], volume: 1 },
        2: { segments: [{ start: 20, text: 'nothing here' }], volume: 2 },
    },
};

const useTranscriptStore = (selector: any) => selector(storeState);
useTranscriptStore.getState = () => storeState;

mock.module('@/stores/transcriptStore/useTranscriptStore', () => ({
    useTranscriptStore,
}));

import { SearchDialog } from './search-dialog';

describe('SearchDialog', () => {
    beforeEach(() => {
        storeState.setSelectedPart = jest.fn();
        record.mockReset();
    });

    it('searches transcripts and allows jumping to a part', () => {
        render(<SearchDialog />);

        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'match' } });
        fireEvent.submit(input.closest('form')!);

        expect(record).toHaveBeenCalledWith('SearchTranscripts');
        expect(screen.getByText('match me')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: '1' }));
        expect(storeState.setSelectedPart).toHaveBeenCalledWith(1);
    });
});
