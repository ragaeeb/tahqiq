import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';

// Mock the io module before importing the hook
const mockLoadFromOPFS = jest.fn();
mock.module('@/lib/io', () => ({ loadFromOPFS: mockLoadFromOPFS }));

// Mock nanolytics
const mockRecord = jest.fn();
mock.module('nanolytics', () => ({ record: mockRecord }));

import { STORAGE_KEYS } from '@/lib/constants';
// Import after mocking
import { useSessionRestore } from './use-session-restore';

describe('useSessionRestore', () => {
    beforeEach(() => {
        mockLoadFromOPFS.mockReset();
        mockRecord.mockReset();
    });

    it('should call loadFromOPFS with the correct storage key', async () => {
        const mockInit = jest.fn();
        mockLoadFromOPFS.mockResolvedValue(null);

        renderHook(() => useSessionRestore(STORAGE_KEYS.excerpts, mockInit, 'RestoreExcerptsFromSession'));

        await waitFor(() => {
            expect(mockLoadFromOPFS).toHaveBeenCalledWith('excerpts');
        });
    });

    it('should call init with data when loadFromOPFS returns data', async () => {
        const mockInit = jest.fn();
        const testData = { excerpts: [], footnotes: [], headings: [] };
        mockLoadFromOPFS.mockResolvedValue(testData);

        renderHook(() => useSessionRestore(STORAGE_KEYS.excerpts, mockInit, 'RestoreExcerptsFromSession'));

        await waitFor(() => {
            expect(mockInit).toHaveBeenCalledWith(testData);
            expect(mockRecord).toHaveBeenCalledWith('RestoreExcerptsFromSession');
        });
    });

    it('should not call init when loadFromOPFS returns null', async () => {
        const mockInit = jest.fn();
        mockLoadFromOPFS.mockResolvedValue(null);

        renderHook(() => useSessionRestore(STORAGE_KEYS.excerpts, mockInit, 'RestoreExcerptsFromSession'));

        await waitFor(() => {
            expect(mockLoadFromOPFS).toHaveBeenCalled();
        });

        expect(mockInit).not.toHaveBeenCalled();
        expect(mockRecord).not.toHaveBeenCalled();
    });

    it('should apply adapter function when provided', async () => {
        const mockInit = jest.fn();
        const rawData = { data: 'test', legacy: true };
        const adaptedData = { modern: true, value: 'adapted' };
        const mockAdapter = jest.fn().mockReturnValue(adaptedData);
        mockLoadFromOPFS.mockResolvedValue(rawData);

        renderHook(() =>
            useSessionRestore(STORAGE_KEYS.transcript, mockInit, 'RestoreTranscriptFromSession', mockAdapter),
        );

        await waitFor(() => {
            expect(mockAdapter).toHaveBeenCalledWith(rawData);
            expect(mockInit).toHaveBeenCalledWith(adaptedData);
        });
    });

    it('should work with different storage keys', async () => {
        const mockInit = jest.fn();
        mockLoadFromOPFS.mockResolvedValue({ pages: [] });

        renderHook(() => useSessionRestore(STORAGE_KEYS.shamela, mockInit, 'RestoreShamelaFromSession'));

        await waitFor(() => {
            expect(mockLoadFromOPFS).toHaveBeenCalledWith('shamela');
        });
    });

    it('should only run effect once on mount', async () => {
        const mockInit = jest.fn();
        mockLoadFromOPFS.mockResolvedValue({ data: 'test' });

        const { rerender } = renderHook(() =>
            useSessionRestore(STORAGE_KEYS.excerpts, mockInit, 'RestoreExcerptsFromSession'),
        );

        await waitFor(() => {
            expect(mockLoadFromOPFS).toHaveBeenCalledTimes(1);
        });

        // Rerender shouldn't trigger another load
        rerender();

        // Still should only be called once
        expect(mockLoadFromOPFS).toHaveBeenCalledTimes(1);
    });
});
