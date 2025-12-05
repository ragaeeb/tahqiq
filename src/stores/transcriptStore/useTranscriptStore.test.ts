import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { resetTranscriptStoreState } from '@/test-utils/transcriptStore';
import { useTranscriptStore } from '@/stores/transcriptStore/useTranscriptStore';

describe('useTranscriptStore', () => {
    beforeEach(() => {
        resetTranscriptStoreState();
    });

    afterEach(() => {
        resetTranscriptStoreState();
    });

    describe('mergeSegments', () => {
        it('should correctly merge two segments when selecting the entire range', () => {
            const segments = [
                {
                    end: 2,
                    start: 0,
                    text: 'The quick',
                    tokens: [
                        { end: 1, start: 0, text: 'The' },
                        { end: 2, start: 1, text: 'quick' },
                    ],
                },
                {
                    end: 4,
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
                transcripts: { 1: { segments, timestamp: new Date(), volume: 1 } },
            });

            useTranscriptStore.getInitialState().mergeSegments();

            const state = useTranscriptStore.getState();
            expect(state.selectedSegments).toHaveLength(0);
            expect(state.transcripts[1]?.segments).toEqual([
                {
                    end: 4,
                    start: 0.001,
                    text: 'The quick\nbrown fox',
                    tokens: [
                        { end: 1, start: 0, text: 'The' },
                        { end: 2, start: 1, text: 'quick' },
                        { end: 3.5, start: 3, text: 'brown' },
                        { end: 4, start: 3.5, text: 'fox' },
                    ],
                },
            ]);
        });

        it('should correctly merge two segments when selecting a subset', () => {
            const segments = [
                {
                    end: 2,
                    start: 0,
                    text: 'The quick',
                    tokens: [
                        { end: 1, start: 0, text: 'The' },
                        { end: 2, start: 1, text: 'quick' },
                    ],
                },
                {
                    end: 4,
                    start: 3,
                    text: 'brown fox',
                    tokens: [
                        { end: 3.5, start: 3, text: 'brown' },
                        { end: 4, start: 3.5, text: 'fox' },
                    ],
                },
                {
                    end: 7,
                    start: 5,
                    text: 'jumps right',
                    tokens: [
                        { end: 6, start: 5, text: 'jumps' },
                        { end: 7, start: 6.5, text: 'right' },
                    ],
                },
            ];

            useTranscriptStore.setState({
                selectedPart: 1,
                selectedSegments: [segments[0]!, segments[1]!],
                transcripts: { 1: { segments, timestamp: new Date(), volume: 1 } },
            });

            useTranscriptStore.getInitialState().mergeSegments();

            const state = useTranscriptStore.getState();
            expect(state.selectedSegments).toHaveLength(0);
            expect(state.transcripts[1]?.segments).toEqual([
                {
                    end: 4,
                    start: 0.001,
                    text: 'The quick\nbrown fox',
                    tokens: [
                        { end: 1, start: 0, text: 'The' },
                        { end: 2, start: 1, text: 'quick' },
                        { end: 3.5, start: 3, text: 'brown' },
                        { end: 4, start: 3.5, text: 'fox' },
                    ],
                },
                {
                    end: 7,
                    start: 5,
                    text: 'jumps right',
                    tokens: [
                        { end: 6, start: 5, text: 'jumps' },
                        { end: 7, start: 6.5, text: 'right' },
                    ],
                },
            ]);
        });

        it('should not merge segments when less than 2 segments are selected', () => {
            useTranscriptStore.setState({
                selectedPart: 1,
                selectedSegments: [],
                transcripts: { 1: { segments: [], timestamp: new Date(), volume: 1 } },
            });

            const initialSegments = [...useTranscriptStore.getState().transcripts[1]!.segments];

            useTranscriptStore.getState().mergeSegments();

            // State should not change
            const state = useTranscriptStore.getState();
            expect(state.transcripts[1]?.segments).toEqual(initialSegments);
        });

        it('should not merge segments when more than 2 segments are selected', () => {
            // Setup with three selected segments
            useTranscriptStore.setState({
                selectedPart: 1,
                selectedSegments: [{}, {}, {}],
                transcripts: { 1: { segments: [] } },
            } as any);

            const initialSegments = [...useTranscriptStore.getState().transcripts[1]!.segments];

            useTranscriptStore.getState().mergeSegments();

            // State should not change
            const state = useTranscriptStore.getState();
            expect(state.transcripts[1]?.segments).toEqual(initialSegments);
        });
    });

    describe('init', () => {
        it('should initialize store with provided transcript data', () => {
            const now = new Date();
            const testData = {
                contractVersion: 'v1.0' as const,
                createdAt: now,
                lastUpdatedAt: now,
                transcripts: [
                    {
                        segments: [
                            {
                                end: 2,
                                start: 0,
                                text: 'Hello world',
                                tokens: [
                                    { end: 1, start: 0, text: 'Hello' },
                                    { end: 2, start: 1, text: 'world' },
                                ],
                            },
                        ],
                        timestamp: now,
                        volume: 1,
                    },
                ],
            };

            useTranscriptStore.getState().init(testData);

            const state = useTranscriptStore.getState();
            expect(state.createdAt.toString()).toBe(now.toString());
            expect(state.selectedPart).toBe(1);
            expect(state.transcripts[1]).toEqual(testData.transcripts[0]!);
        });
    });

    describe('deleteSelectedSegments', () => {
        it('should remove selected segments from the current transcript', () => {
            const segments = [
                {
                    end: 2,
                    start: 0,
                    text: 'The quick',
                    tokens: [
                        { end: 1, start: 0, text: 'The' },
                        { end: 2, start: 1, text: 'quick' },
                    ],
                },
                {
                    end: 4,
                    start: 3,
                    text: 'brown fox',
                    tokens: [
                        { end: 3.5, start: 3, text: 'brown' },
                        { end: 4, start: 3.5, text: 'fox' },
                    ],
                },
                {
                    end: 7,
                    start: 5,
                    text: 'jumps right',
                    tokens: [
                        { end: 6, start: 5, text: 'jumps' },
                        { end: 7, start: 6.5, text: 'right' },
                    ],
                },
            ];

            useTranscriptStore.setState({
                selectedPart: 1,
                selectedSegments: [segments[0]!, segments[2]!],
                transcripts: { 1: { segments, timestamp: new Date(), volume: 1 } },
            });

            useTranscriptStore.getState().deleteSelectedSegments();

            const state = useTranscriptStore.getState();
            expect(state.selectedSegments).toHaveLength(0);
            expect(state.transcripts[1]?.segments).toEqual([segments[1]!]);
        });
    });

    describe('markCompleted', () => {
        it('should mark selected segments as done', () => {
            const segments = [
                {
                    end: 2,
                    start: 0,
                    text: 'The quick',
                    tokens: [
                        { end: 1, start: 0, text: 'The' },
                        { end: 2, start: 1, text: 'quick' },
                    ],
                },
                {
                    end: 4,
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
                selectedSegments: [segments[0]!],
                transcripts: { 1: { segments, timestamp: new Date(), volume: 1 } },
            });

            useTranscriptStore.getState().markCompleted();

            const state = useTranscriptStore.getState();
            expect(state.selectedSegments).toHaveLength(0);
            expect(state.transcripts[1]?.segments[0]!.status).toBe('done');
            expect(state.transcripts[1]?.segments[1]!.status).toBeUndefined();
        });
    });

    describe('selectAllSegments', () => {
        it('should select all segments when isSelected is true', () => {
            const segments = [
                {
                    end: 2,
                    start: 0,
                    text: 'The quick',
                    tokens: [
                        { end: 1, start: 0, text: 'The' },
                        { end: 2, start: 1, text: 'quick' },
                    ],
                },
                {
                    end: 4,
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
                selectedSegments: [],
                transcripts: { 1: { segments, timestamp: new Date(), volume: 1 } },
            });

            useTranscriptStore.getState().selectAllSegments(true);

            const state = useTranscriptStore.getState();
            expect(state.selectedSegments).toEqual(segments);
        });

        it('should deselect all segments when isSelected is false', () => {
            const segments = [
                {
                    end: 2,
                    start: 0,
                    text: 'The quick',
                    tokens: [
                        { end: 1, start: 0, text: 'The' },
                        { end: 2, start: 1, text: 'quick' },
                    ],
                },
                {
                    end: 4,
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
                transcripts: { 1: { segments, timestamp: new Date(), volume: 1 } },
            });

            useTranscriptStore.getState().selectAllSegments(false);

            const state = useTranscriptStore.getState();
            expect(state.selectedSegments).toHaveLength(0);
        });
    });

    describe('setFormattingOptions', () => {
        it('should update formatting options', () => {
            const newOptions = {
                fillers: ['um', 'uh'],
                flipPunctuation: false,
                hints: ['hint1', 'hint2'],
                maxSecondsPerLine: 5,
                maxSecondsPerSegment: 10,
                minWordsPerSegment: 3,
                silenceGapThreshold: 0.8,
            };

            useTranscriptStore.getState().setFormattingOptions(newOptions);

            const state = useTranscriptStore.getState();
            expect(state.formatOptions).toEqual(newOptions);
        });
    });

    describe('setSelectedPart', () => {
        it('should update selected part and clear selected segments', () => {
            const segments = [
                {
                    end: 2,
                    start: 0,
                    text: 'The quick',
                    tokens: [
                        { end: 1, start: 0, text: 'The' },
                        { end: 2, start: 1, text: 'quick' },
                    ],
                },
            ];

            useTranscriptStore.setState({
                selectedPart: 1,
                selectedSegments: segments,
                transcripts: {
                    1: { segments, timestamp: new Date(), volume: 1 },
                    2: { segments: [], timestamp: new Date(), volume: 2 },
                },
            });

            useTranscriptStore.getState().setSelectedPart(2);

            const state = useTranscriptStore.getState();
            expect(state.selectedPart).toBe(2);
            expect(state.selectedSegments).toHaveLength(0);
        });
    });

    describe('setSelectedToken', () => {
        it('should update the selected token', () => {
            const token = { end: 1, start: 0, text: 'test' };

            useTranscriptStore.getState().setSelectedToken(token);

            const state = useTranscriptStore.getState();
            expect(state.selectedToken).toBe(token);
        });

        it('should clear the selected token when null is passed', () => {
            const token = { end: 1, start: 0, text: 'test' };
            useTranscriptStore.setState({ selectedToken: token });

            useTranscriptStore.getState().setSelectedToken(null);

            const state = useTranscriptStore.getState();
            expect(state.selectedToken).toBeNull();
        });
    });

    describe('toggleSegmentSelection', () => {
        it('should add segment to selection when isSelected is true', () => {
            const segments = [
                {
                    end: 2,
                    start: 0,
                    text: 'The quick',
                    tokens: [
                        { end: 1, start: 0, text: 'The' },
                        { end: 2, start: 1, text: 'quick' },
                    ],
                },
                {
                    end: 4,
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
                selectedSegments: [],
                transcripts: { 1: { segments, timestamp: new Date(), volume: 1 } },
            });

            useTranscriptStore.getState().toggleSegmentSelection(segments[0]!, true);

            const state = useTranscriptStore.getState();
            expect(state.selectedSegments).toEqual([segments[0]!]);
        });

        it('should remove segment from selection when isSelected is false', () => {
            const segments = [
                {
                    end: 2,
                    start: 0,
                    text: 'The quick',
                    tokens: [
                        { end: 1, start: 0, text: 'The' },
                        { end: 2, start: 1, text: 'quick' },
                    ],
                },
                {
                    end: 4,
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
                transcripts: { 1: { segments, timestamp: new Date(), volume: 1 } },
            });

            useTranscriptStore.getState().toggleSegmentSelection(segments[0]!, false);

            const state = useTranscriptStore.getState();
            expect(state.selectedSegments).toEqual([segments[1]!]);
        });
    });

    describe('updateSegment', () => {
        it('should update the specified segment with the given changes', () => {
            const segments = [
                {
                    end: 2,
                    start: 0,
                    text: 'The quick',
                    tokens: [
                        { end: 1, start: 0, text: 'The' },
                        { end: 2, start: 1, text: 'quick' },
                    ],
                },
                {
                    end: 4,
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
                transcripts: { 1: { segments, timestamp: new Date(), volume: 1 } },
            });

            const update = { status: 'done' as const, text: 'The fast' };
            useTranscriptStore.getState().updateSegment(0, update);

            const state = useTranscriptStore.getState();
            expect(state.transcripts[1]?.segments[0]).toEqual({ ...segments[0]!, ...update });
            // Ensure other segments are not affected
            expect(state.transcripts[1]?.segments[1]).toBe(segments[1]!);
        });
    });

    describe('splitSegment', () => {
        it('should split a segment at the selected token position', () => {
            const segment = {
                end: 4,
                start: 0,
                text: 'The quick brown fox',
                tokens: [
                    { end: 1, start: 0, text: 'The' },
                    { end: 2, start: 1, text: 'quick' },
                    { end: 3, start: 2, text: 'brown' },
                    { end: 4, start: 3, text: 'fox' },
                ],
            };

            const selectedToken = { end: 2, start: 1, text: 'quick' };

            useTranscriptStore.setState({
                selectedPart: 1,
                selectedToken,
                transcripts: { 1: { segments: [segment], timestamp: new Date(), volume: 1 } },
            });

            useTranscriptStore.getState().splitSegment();

            const state = useTranscriptStore.getState();
            expect(state.selectedToken).toBeNull();
            expect(state.transcripts[1]?.segments.length).toBe(2);

            // Check first segment (from start to token start)
            expect(state.transcripts[1]?.segments[0]).toMatchObject({
                end: 1,
                start: 0.001, // START_DIFF applied
                text: 'The',
                tokens: [{ end: 1, start: 0, text: 'The' }],
            });

            // Check second segment (from token start to end)
            expect(state.transcripts[1]?.segments[1]).toMatchObject({
                end: 4,
                start: 1.001, // START_DIFF applied
                text: 'quick brown fox',
                tokens: [
                    { end: 2, start: 1, text: 'quick' },
                    { end: 3, start: 2, text: 'brown' },
                    { end: 4, start: 3, text: 'fox' },
                ],
            });
        });

        it('should not split when no token is selected', () => {
            const segment = {
                end: 4,
                start: 0,
                text: 'The quick brown fox',
                tokens: [
                    { end: 1, start: 0, text: 'The' },
                    { end: 2, start: 1, text: 'quick' },
                    { end: 3, start: 2, text: 'brown' },
                    { end: 4, start: 3, text: 'fox' },
                ],
            };

            useTranscriptStore.setState({
                selectedPart: 1,
                selectedToken: null,
                transcripts: { 1: { segments: [segment], timestamp: new Date(), volume: 1 } },
            });

            const initialSegments = [...useTranscriptStore.getState().transcripts[1]!.segments];

            useTranscriptStore.getState().splitSegment();

            const state = useTranscriptStore.getState();
            expect(state.transcripts[1]?.segments).toEqual(initialSegments);
        });

        it('should not split when the token is not found in any segment', () => {
            const segment = {
                end: 4,
                start: 0,
                text: 'The quick brown fox',
                tokens: [
                    { end: 1, start: 0, text: 'The' },
                    { end: 2, start: 1, text: 'quick' },
                    { end: 3, start: 2, text: 'brown' },
                    { end: 4, start: 3, text: 'fox' },
                ],
            };

            // Token that doesn't belong to any segment
            const selectedToken = { end: 10, start: 9, text: 'nonexistent' };

            useTranscriptStore.setState({
                selectedPart: 1,
                selectedToken,
                transcripts: { 1: { segments: [segment], timestamp: new Date(), volume: 1 } },
            });

            const initialSegments = [...useTranscriptStore.getState().transcripts[1]!.segments];

            useTranscriptStore.getState().splitSegment();

            const state = useTranscriptStore.getState();
            expect(state.transcripts[1]?.segments).toEqual(initialSegments);
        });
    });
});
