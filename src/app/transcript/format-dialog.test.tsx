import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';

const record = jest.fn();

mock.module('nanolytics', () => ({
    record,
}));

mock.module('@/components/ui/dialog', () => ({
    DialogClose: ({ children }: any) => <>{children}</>,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

mock.module('@/components/ui/tag-input', () => ({
    TagInput: ({ onChange, value = [] }: any) => {
        return <input data-testid="tag-input" onChange={(e) => onChange([e.target.value])} />;
    },
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

const storeState: any = {
    formatOptions: {
        fillers: ['filler-marker'],
        flipPunctuation: false,
        hints: ['hint-marker'],
        maxSecondsPerLine: 40,
        maxSecondsPerSegment: 60,
        minWordsPerSegment: 4,
        silenceGapThreshold: 1,
    },
    setFormattingOptions: jest.fn(),
};

mock.module('@/stores/transcriptStore/useTranscriptStore', () => ({
    useTranscriptStore: (selector: any) => selector(storeState),
}));

import { FormatDialog } from './format-dialog';

describe('FormatDialog', () => {
    beforeEach(() => {
        storeState.setFormattingOptions = jest.fn();
        record.mockReset();
    });

    it('applies updated formatting preferences', () => {
        render(<FormatDialog />);

        const [hintsInput, fillersInput] = screen.getAllByTestId('tag-input');
        fireEvent.click(screen.getByLabelText('Flip English to Arabic Punctuation'));
        fireEvent.change(hintsInput, { target: { value: 'new-hint' } });
        fireEvent.change(fillersInput, { target: { value: 'new-filler' } });

        fireEvent.click(screen.getByText('Apply'));

        expect(storeState.setFormattingOptions).toHaveBeenCalledWith(
            expect.objectContaining({
                fillers: ['new-filler'],
                flipPunctuation: true,
                hints: ['new-hint'],
            }),
        );
        expect(record).toHaveBeenCalledWith('ApplyFormattingOptions');
    });
});
