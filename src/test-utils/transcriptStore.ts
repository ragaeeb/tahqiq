import { act } from '@testing-library/react';

import type { FormatOptions } from '@/stores/transcriptStore/types';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

const cloneOptions = (options: FormatOptions): FormatOptions => JSON.parse(JSON.stringify(options));

const initialFormatOptions = cloneOptions(useTranscriptStore.getState().formatOptions);

const runInAct = (callback: () => void) => {
    act(() => {
        callback();
    });
};

export const resetTranscriptStoreState = () => {
    runInAct(() => {
        useTranscriptStore.getState().reset();
        useTranscriptStore.setState({ formatOptions: cloneOptions(initialFormatOptions) });
    });
};

export const setTranscriptFormatOptions = (options: FormatOptions) => {
    runInAct(() => {
        useTranscriptStore.setState({ formatOptions: cloneOptions(options) });
    });
};
