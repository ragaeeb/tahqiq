import { afterEach, beforeEach, describe, expect, it, jest, mock } from 'bun:test';
import { act, fireEvent, render, screen } from '@testing-library/react';

import type { FormatOptions } from '@/stores/transcriptStore/types';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';
import { resetTranscriptStoreState, setTranscriptFormatOptions } from '@/test-utils/transcriptStore';

const record = jest.fn();

mock.module('nanolytics', () => ({ record }));

mock.module('@/components/ui/dialog', () => ({
    DialogClose: ({ children }: any) => <>{children}</>,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

mock.module('@/components/ui/tag-input', () => ({
    TagInput: ({ onChange }: any) => <input data-testid="tag-input" onChange={(e) => onChange([e.target.value])} />,
}));

mock.module('@/components/ui/slider', () => ({
    Slider: ({ onValueChange, value = [0], min = 0, max = 100 }: any) => (
        <input
            aria-label={`slider-${min}-${max}`}
            onChange={(e) => onValueChange?.([Number(e.target.value)])}
            type="range"
            value={value[0] ?? 0}
        />
    ),
}));

import { FormatDialog } from './format-dialog';

const testFormatOptions: FormatOptions = {
    fillers: ['filler-marker'],
    flipPunctuation: false,
    hints: ['hint-marker'],
    maxSecondsPerLine: 40,
    maxSecondsPerSegment: 60,
    minWordsPerSegment: 4,
    silenceGapThreshold: 1,
};

let setFormattingOptionsSpy: jest.Mock;

describe('FormatDialog', () => {
    beforeEach(() => {
        resetTranscriptStoreState();
        setTranscriptFormatOptions(testFormatOptions);
        record.mockReset();
        setFormattingOptionsSpy = jest
            .spyOn(useTranscriptStore.getState(), 'setFormattingOptions')
            .mockImplementation(() => {});
    });

    afterEach(() => {
        setFormattingOptionsSpy.mockRestore();
        resetTranscriptStoreState();
    });

    it('applies updated formatting preferences', async () => {
        render(<FormatDialog />);

        const [hintsInput, fillersInput] = screen.getAllByTestId('tag-input');

        await act(async () => {
            fireEvent.click(screen.getByLabelText('Flip English to Arabic Punctuation'));
            fireEvent.change(hintsInput, { target: { value: 'new-hint' } });
            fireEvent.change(fillersInput, { target: { value: 'new-filler' } });
        });

        await act(async () => {
            fireEvent.click(screen.getByText('Apply'));
        });

        expect(setFormattingOptionsSpy).toHaveBeenCalledWith(
            expect.objectContaining({ fillers: ['new-filler'], flipPunctuation: true, hints: ['new-hint'] }),
        );
        expect(record).toHaveBeenCalledWith('ApplyFormattingOptions');
    });
});
