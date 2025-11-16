import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, jest, mock } from 'bun:test';

import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';
import { resetTranscriptStoreState } from '@/test-utils/transcriptStore';

const record = jest.fn();

mock.module('nanolytics', () => ({
    record,
}));

mock.module('@/components/ui/dialog', () => ({
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h4>{children}</h4>,
}));

import { SearchDialog } from './search-dialog';

let setSelectedPartSpy: jest.Mock;

describe('SearchDialog', () => {
    beforeEach(() => {
        resetTranscriptStoreState();
        useTranscriptStore.setState({
            transcripts: {
                1: { segments: [{ start: 10, text: 'match me' }], timestamp: new Date(), volume: 1 },
                2: { segments: [{ start: 20, text: 'nothing here' }], timestamp: new Date(), volume: 2 },
            },
        });
        setSelectedPartSpy = jest
            .spyOn(useTranscriptStore.getState(), 'setSelectedPart')
            .mockImplementation(() => {});
        record.mockReset();
    });

    afterEach(() => {
        setSelectedPartSpy.mockRestore();
        resetTranscriptStoreState();
    });

    it('searches transcripts and allows jumping to a part', async () => {
        await act(async () => {
            render(<SearchDialog />);
        });

        const queryField = screen.getByRole('textbox');

        await act(async () => {
            fireEvent.change(queryField, { target: { value: 'match' } });
        });

        await act(async () => {
            fireEvent.submit(queryField.closest('form')!);
        });

        expect(await screen.findByText('match me')).toBeInTheDocument();

        const goToPart = await screen.findByRole('button', { name: '1' });
        await act(async () => {
            fireEvent.click(goToPart);
        });
        expect(setSelectedPartSpy).toHaveBeenCalledWith(1);
        expect(record).toHaveBeenCalledWith('SearchTranscripts');
        expect(record).toHaveBeenCalledWith('SelectPartSearchTranscript');
    });
});
