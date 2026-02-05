import { describe, expect, it } from 'bun:test';
import { LatestContractVersion } from '@/lib/constants';
import {
    addTranscriptsFromFiles,
    applySelection,
    initStore,
    markSelectedDone,
    mergeSelectedSegments,
    removeSelectedSegments,
    selectAllSegments,
    setUrlsForTranscript,
    updateSegmentWithDiff,
} from './actions';
import type { Segment, TranscriptState } from './types';

const createMockState = (overrides: Partial<TranscriptState> = {}): TranscriptState =>
    ({
        formatOptions: {
            fillers: [],
            flipPunctuation: false,
            hints: [],
            maxSecondsPerLine: 10,
            maxSecondsPerSegment: 60,
            minWordsPerSegment: 5,
            silenceGapThreshold: 2,
        },
        selectedPart: 1,
        selectedSegments: [],
        selectedToken: null,
        transcripts: {
            1: {
                segments: [
                    { end: 5, start: 0, text: 'First segment', tokens: [] },
                    { end: 10, start: 5, text: 'Second segment', tokens: [] },
                    { end: 15, start: 10, text: 'Third segment', tokens: [] },
                ],
                timestamp: new Date('2024-01-01T00:00:00Z'),
                volume: 1,
            },
        },
        ...overrides,
    }) as unknown as TranscriptState;

describe('transcriptStore/actions', () => {
    describe('initStore', () => {
        it('should initialize store from transcript series data', () => {
            const result = initStore({
                contractVersion: LatestContractVersion.Transcript,
                createdAt: new Date('2024-01-01T00:00:00Z'),
                groundTruth: undefined,
                lastUpdatedAt: new Date('2024-01-01T00:00:00Z'),
                transcripts: [
                    { segments: [], timestamp: new Date('2024-01-01T00:00:00Z'), volume: 1 },
                    { segments: [], timestamp: new Date('2024-01-01T00:00:00Z'), volume: 2 },
                ],
                urls: ['url1', 'url2'],
            });

            expect(result.selectedPart).toBe(1);
            expect(result.groundTruth).toBeUndefined();
            expect(result.urls).toEqual(['url1', 'url2']);
            expect(Object.keys(result.transcripts)).toHaveLength(2);
            expect(result.transcripts['1']).toBeDefined();
            expect(result.transcripts['2']).toBeDefined();
        });
    });

    describe('addTranscriptsFromFiles', () => {
        it('should add transcripts from file data', () => {
            const state = createMockState();
            const files = { 'vol2.json': { segments: [], timestamp: new Date('2024-01-01T00:00:00Z'), volume: 2 } };

            const result = addTranscriptsFromFiles(state, files);

            expect(Object.keys(result.transcripts)).toHaveLength(2);
            expect(result.transcripts['2']).toBeDefined();
        });
    });

    describe('markSelectedDone', () => {
        it('should mark selected segments as done', () => {
            const state = createMockState({
                selectedSegments: [{ end: 5, start: 0, text: 'First segment', tokens: [] }],
            });

            const result = markSelectedDone(state);

            expect(result.selectedSegments).toEqual([]);
            expect(result.transcripts['1']?.segments[0]?.status).toBe('done');
            expect(result.transcripts['1']?.segments[1]?.status).toBeUndefined();
        });
    });

    describe('mergeSelectedSegments', () => {
        it('should merge two selected segments into one', () => {
            const state = createMockState({
                selectedSegments: [
                    { end: 5, start: 0, text: 'First segment', tokens: [] },
                    { end: 10, start: 5, text: 'Second segment', tokens: [] },
                ],
            });

            const result = mergeSelectedSegments(state);

            expect(result.selectedSegments).toEqual([]);
            expect(result.transcripts?.['1']?.segments).toHaveLength(2);
            expect(result.transcripts?.['1']?.segments[0]?.text).toContain('First segment');
            expect(result.transcripts?.['1']?.segments[0]?.text).toContain('Second segment');
        });

        it('should return empty object if not exactly 2 segments selected', () => {
            const state = createMockState({ selectedSegments: [{ end: 5, start: 0, text: 'Only one', tokens: [] }] });

            const result = mergeSelectedSegments(state);

            expect(result).toEqual({});
        });
    });

    describe('selectAllSegments', () => {
        it('should select all segments when isSelected is true', () => {
            const state = createMockState();

            const result = selectAllSegments(state, true);

            expect(result.selectedSegments).toHaveLength(3);
        });

        it('should clear selection when isSelected is false', () => {
            const state = createMockState({ selectedSegments: [{ end: 5, start: 0, text: 'Selected', tokens: [] }] });

            const result = selectAllSegments(state, false);

            expect(result.selectedSegments).toEqual([]);
        });
    });

    describe('applySelection', () => {
        it('should add segment to selection when isSelected is true', () => {
            const state = createMockState();
            const segment: Segment = { end: 5, start: 0, text: 'Segment', tokens: [] };

            const result = applySelection(state, segment, true);

            expect(result.selectedSegments).toHaveLength(1);
            expect(result.selectedSegments[0]?.start).toBe(0);
        });

        it('should remove segment from selection when isSelected is false', () => {
            const segment: Segment = { end: 5, start: 0, text: 'Segment', tokens: [] };
            const state = createMockState({ selectedSegments: [segment] });

            const result = applySelection(state, segment, false);

            expect(result.selectedSegments).toHaveLength(0);
        });
    });

    describe('setUrlsForTranscript', () => {
        it('should set urls on current transcript', () => {
            const state = createMockState();

            const result = setUrlsForTranscript(state, ['url1', 'url2']);

            expect(result.transcripts['1']?.urls).toEqual(['url1', 'url2']);
        });
    });

    describe('removeSelectedSegments', () => {
        it('should remove selected segments from transcript', () => {
            const state = createMockState({
                selectedSegments: [{ end: 5, start: 0, text: 'First segment', tokens: [] }],
            });

            const result = removeSelectedSegments(state);

            expect(result.selectedSegments).toEqual([]);
            expect(result.transcripts['1']?.segments).toHaveLength(2);
            expect(result.transcripts['1']?.segments[0]?.text).toBe('Second segment');
        });
    });

    describe('updateSegmentWithDiff', () => {
        it('should update segment properties', () => {
            const state = createMockState();

            const result = updateSegmentWithDiff(state, 0, { text: 'Updated text' });

            expect(result.transcripts['1']?.segments[0]?.text).toBe('Updated text');
        });

        it('should add start offset when shouldForceRefresh is true', () => {
            const state = createMockState();
            const originalStart = state.transcripts['1']!.segments[0]!.start;

            const result = updateSegmentWithDiff(state, 0, { text: 'Updated' }, true);

            expect(result.transcripts['1']?.segments[0]?.start).toBeGreaterThan(originalStart);
        });
    });
});
