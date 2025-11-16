import type { FormatOptions } from '@/stores/transcriptStore/types';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

const cloneOptions = (options: FormatOptions): FormatOptions => JSON.parse(JSON.stringify(options));

const initialFormatOptions = cloneOptions(useTranscriptStore.getState().formatOptions);

export const resetTranscriptStoreState = () => {
    useTranscriptStore.getState().reset();
    useTranscriptStore.setState({ formatOptions: cloneOptions(initialFormatOptions) });
};

export const setTranscriptFormatOptions = (options: FormatOptions) => {
    useTranscriptStore.setState({ formatOptions: cloneOptions(options) });
};
