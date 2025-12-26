import { describe, expect, it, mock } from 'bun:test';

import type { Segment, TranscriptStateCore } from '@/stores/transcriptStore/types';

// Mock paragrafs module
const mockMarkAndCombineSegments = mock((segments: Segment[]) => segments);
const mockFormatSegmentsToTimestampedTranscript = mock(() => 'Line 1\nLine 2\nLine 3');
const mockCreateHints = mock((...hints: string[]) => hints);

mock.module('paragrafs', () => ({
    createHints: mockCreateHints,
    formatSegmentsToTimestampedTranscript: mockFormatSegmentsToTimestampedTranscript,
    markAndCombineSegments: mockMarkAndCombineSegments,
}));

import { generateFormattedTranscriptFromState } from './transcriptUtils';

describe('transcriptUtils', () => {
    describe('generateFormattedTranscriptFromState', () => {
        const createMockState = (segments: Segment[] = []): TranscriptStateCore => ({
            createdAt: new Date('2024-01-01'),
            formatOptions: {
                fillers: ['um', 'uh'],
                flipPunctuation: false,
                hints: ['hint1', 'hint2'],
                maxSecondsPerLine: 40,
                maxSecondsPerSegment: 60,
                minWordsPerSegment: 4,
                silenceGapThreshold: 1,
            },
            groundTruth: undefined,
            postProcessingApps: [],
            selectedPart: 1,
            selectedSegments: [],
            selectedToken: null,
            transcripts: { 1: { segments, timestamp: new Date('2024-01-01'), volume: 1 } },
            urls: [],
        });

        const mockSegments: Segment[] = [
            { end: 5, start: 0, text: 'First segment', tokens: [] },
            { end: 10, start: 5, text: 'Second segment', tokens: [] },
        ];

        it('should generate formatted transcript from state', () => {
            const state = createMockState(mockSegments);

            const result = generateFormattedTranscriptFromState(state);

            expect(result).toBe('Line 1\n\nLine 2\n\nLine 3');
        });

        it('should call markAndCombineSegments with correct options', () => {
            const state = createMockState(mockSegments);

            generateFormattedTranscriptFromState(state);

            expect(mockMarkAndCombineSegments).toHaveBeenCalledWith(mockSegments, {
                fillers: ['um', 'um.', 'um؟', 'uh', 'uh.', 'uh؟'],
                gapThreshold: 1,
                hints: [{ normalizeAlef: true, normalizeHamza: true, normalizeYa: true }, 'hint1', 'hint2'],
                maxSecondsPerSegment: 60,
                minWordsPerSegment: 4,
            });
        });

        it('should call formatSegmentsToTimestampedTranscript with marked segments', () => {
            const state = createMockState(mockSegments);

            generateFormattedTranscriptFromState(state);

            expect(mockFormatSegmentsToTimestampedTranscript).toHaveBeenCalledWith(mockSegments, 40);
        });

        it('should call createHints with hints from formatOptions', () => {
            const state = createMockState(mockSegments);

            generateFormattedTranscriptFromState(state);

            expect(mockCreateHints).toHaveBeenCalledWith(
                { normalizeAlef: true, normalizeHamza: true, normalizeYa: true },
                'hint1',
                'hint2',
            );
        });

        it('should replace single newlines with double newlines', () => {
            mockFormatSegmentsToTimestampedTranscript.mockImplementationOnce(() => 'a\nb\nc');
            const state = createMockState(mockSegments);

            const result = generateFormattedTranscriptFromState(state);

            expect(result).toBe('a\n\nb\n\nc');
        });

        it('should handle empty segments', () => {
            const state = createMockState([]);
            mockFormatSegmentsToTimestampedTranscript.mockImplementationOnce(() => '');

            const result = generateFormattedTranscriptFromState(state);

            expect(result).toBe('');
        });

        it('should expand fillers with punctuation variants', () => {
            const state = createMockState(mockSegments);
            state.formatOptions.fillers = ['filler'];

            generateFormattedTranscriptFromState(state);

            expect(mockMarkAndCombineSegments).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ fillers: ['filler', 'filler.', 'filler؟'] }),
            );
        });

        it('should use silenceGapThreshold from formatOptions', () => {
            const state = createMockState(mockSegments);
            state.formatOptions.silenceGapThreshold = 2.5;

            generateFormattedTranscriptFromState(state);

            expect(mockMarkAndCombineSegments).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ gapThreshold: 2.5 }),
            );
        });

        it('should use selected transcript from transcripts map', () => {
            const state = createMockState([]);
            state.transcripts[2] = { segments: mockSegments, timestamp: new Date(), volume: 2 };
            (state as any).selectedPart = 2;

            generateFormattedTranscriptFromState(state);

            expect(mockMarkAndCombineSegments).toHaveBeenCalledWith(mockSegments, expect.anything());
        });
    });
});
