import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { type TranscriptState, useTranscriptStore } from './useTranscriptStore'; // Adjust import path as needed

describe('mergeSegments function', () => {
    let originalState: TranscriptState;

    beforeEach(() => {
        originalState = { ...useTranscriptStore.getState() };
    });

    afterEach(() => {
        useTranscriptStore.setState(originalState, true);
    });

    it('should correctly merge two segments when selecting the entire range', () => {
        const segments = [
            {
                end: 2,
                id: 1,
                start: 0,
                text: 'The quick',
                tokens: [
                    { end: 1, start: 0, text: 'The' },
                    { end: 2, start: 1, text: 'quick' },
                ],
            },
            {
                end: 4,
                id: 2,
                start: 3,
                text: 'brown fox',
                tokens: [
                    { end: 3.5, start: 3, text: 'brown' },
                    { end: 4, start: 3.5, text: 'fox' },
                ],
            },
        ];

        useTranscriptStore.setState({
            selectedPart: 1,
            selectedSegments: segments,
            transcripts: { 1: segments },
        });

        useTranscriptStore.getInitialState().mergeSegments();

        const state = useTranscriptStore.getState();
        expect(state.selectedSegments).toBeEmpty();
        expect(state.transcripts[1]).toEqual([
            {
                end: 4,
                id: 1,
                start: 0,
                text: 'The quick\nbrown fox',
                tokens: [
                    {
                        end: 1,
                        start: 0,
                        text: 'The',
                    },
                    {
                        end: 2,
                        start: 1,
                        text: 'quick',
                    },
                    {
                        end: 3.5,
                        start: 3,
                        text: 'brown',
                    },
                    {
                        end: 4,
                        start: 3.5,
                        text: 'fox',
                    },
                ],
            },
        ]);
    });

    it('should correctly merge two segments when selecting a subset', () => {
        const segments = [
            {
                end: 2,
                id: 1,
                start: 0,
                text: 'The quick',
                tokens: [
                    { end: 1, start: 0, text: 'The' },
                    { end: 2, start: 1, text: 'quick' },
                ],
            },
            {
                end: 4,
                id: 2,
                start: 3,
                text: 'brown fox',
                tokens: [
                    { end: 3.5, start: 3, text: 'brown' },
                    { end: 4, start: 3.5, text: 'fox' },
                ],
            },
            {
                end: 6,
                id: 3,
                start: 5,
                text: 'jumps right',
                tokens: [
                    { end: 6, start: 5.5, text: 'jumps' },
                    { end: 5, start: 5.5, text: 'right' },
                ],
            },
        ];

        useTranscriptStore.setState({
            selectedPart: 1,
            selectedSegments: [segments[0]!, segments[1]!],
            transcripts: { 1: segments },
        });

        useTranscriptStore.getInitialState().mergeSegments();

        const state = useTranscriptStore.getState();
        expect(state.selectedSegments).toBeEmpty();
        expect(state.transcripts[1]).toEqual([
            {
                end: 4,
                id: 1,
                start: 0,
                text: 'The quick\nbrown fox',
                tokens: [
                    {
                        end: 1,
                        start: 0,
                        text: 'The',
                    },
                    {
                        end: 2,
                        start: 1,
                        text: 'quick',
                    },
                    {
                        end: 3.5,
                        start: 3,
                        text: 'brown',
                    },
                    {
                        end: 4,
                        start: 3.5,
                        text: 'fox',
                    },
                ],
            },
            {
                end: 6,
                id: 3,
                start: 5,
                text: 'jumps right',
                tokens: [
                    { end: 6, start: 5.5, text: 'jumps' },
                    { end: 5, start: 5.5, text: 'right' },
                ],
            },
        ]);
    });
});
