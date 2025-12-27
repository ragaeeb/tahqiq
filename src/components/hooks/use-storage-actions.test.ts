import { afterEach, beforeEach, describe, expect, it, jest, mock } from 'bun:test';
import { act, renderHook } from '@testing-library/react';

// Mock modules before importing the hook
const mockSaveToOPFS = jest.fn();
const mockClearStorage = jest.fn();
const mockDownloadFile = jest.fn();
mock.module('@/lib/io', () => ({ clearStorage: mockClearStorage, saveToOPFS: mockSaveToOPFS }));

mock.module('@/lib/domUtils', () => ({ downloadFile: mockDownloadFile }));

// Mock nanolytics
const mockRecord = jest.fn();
mock.module('nanolytics', () => ({ record: mockRecord }));

// Mock sonner toast
const mockToast = { error: jest.fn(), success: jest.fn() };
mock.module('sonner', () => ({ toast: mockToast }));

// Mock prompt
const originalPrompt = globalThis.prompt;

import { STORAGE_KEYS } from '@/lib/constants';
// Import after mocking
import { useStorageActions } from './use-storage-actions';

describe('useStorageActions', () => {
    beforeEach(() => {
        mockSaveToOPFS.mockReset();
        mockClearStorage.mockReset();
        mockDownloadFile.mockReset();
        mockRecord.mockReset();
        mockToast.success.mockReset();
        mockToast.error.mockReset();
        globalThis.prompt = jest.fn();
    });

    afterEach(() => {
        globalThis.prompt = originalPrompt;
    });

    const createOptions = (overrides = {}) => ({
        analytics: { download: 'DownloadExcerpts', reset: 'ResetExcerpts', save: 'SaveExcerpts' },
        getExportData: jest.fn().mockReturnValue({ test: 'data' }),
        reset: jest.fn(),
        storageKey: STORAGE_KEYS.excerpts,
        ...overrides,
    });

    describe('handleSave', () => {
        it('should save data to OPFS and show success toast', async () => {
            const options = createOptions();
            mockSaveToOPFS.mockResolvedValue(undefined);

            const { result } = renderHook(() => useStorageActions(options));

            await act(async () => {
                await result.current.handleSave();
            });

            expect(mockRecord).toHaveBeenCalledWith('SaveExcerpts');
            expect(options.getExportData).toHaveBeenCalled();
            expect(mockSaveToOPFS).toHaveBeenCalledWith('excerpts', { test: 'data' });
            expect(mockToast.success).toHaveBeenCalledWith('Saved state');
        });

        it('should fallback to download when OPFS save fails', async () => {
            const options = createOptions();
            mockSaveToOPFS.mockRejectedValue(new Error('OPFS error'));

            const { result } = renderHook(() => useStorageActions(options));

            await act(async () => {
                await result.current.handleSave();
            });

            expect(mockDownloadFile).toHaveBeenCalled();
            // Should include storage key in filename
            expect(mockDownloadFile.mock.calls[0][0]).toContain('excerpts');
        });
    });

    describe('handleDownload', () => {
        it('should prompt for filename and download', async () => {
            const options = createOptions();
            (globalThis.prompt as jest.Mock).mockReturnValue('my-export');

            const { result } = renderHook(() => useStorageActions(options));

            act(() => {
                result.current.handleDownload();
            });

            expect(globalThis.prompt).toHaveBeenCalledWith('Enter output file name');
            expect(mockRecord).toHaveBeenCalledWith('DownloadExcerpts', 'my-export');
            expect(options.getExportData).toHaveBeenCalled();
            expect(mockDownloadFile).toHaveBeenCalledWith('my-export.json', JSON.stringify({ test: 'data' }, null, 2));
        });

        it('should append .json extension if not provided', async () => {
            const options = createOptions();
            (globalThis.prompt as jest.Mock).mockReturnValue('my-export');

            const { result } = renderHook(() => useStorageActions(options));

            act(() => {
                result.current.handleDownload();
            });

            expect(mockDownloadFile.mock.calls[0][0]).toBe('my-export.json');
        });

        it('should not append .json if already present', async () => {
            const options = createOptions();
            (globalThis.prompt as jest.Mock).mockReturnValue('my-export.json');

            const { result } = renderHook(() => useStorageActions(options));

            act(() => {
                result.current.handleDownload();
            });

            expect(mockDownloadFile.mock.calls[0][0]).toBe('my-export.json');
        });

        it('should do nothing if no filename provided', async () => {
            const options = createOptions();
            (globalThis.prompt as jest.Mock).mockReturnValue(null);

            const { result } = renderHook(() => useStorageActions(options));

            act(() => {
                result.current.handleDownload();
            });

            expect(mockDownloadFile).not.toHaveBeenCalled();
            expect(mockRecord).not.toHaveBeenCalled();
        });
    });

    describe('handleReset', () => {
        it('should record analytics, reset, and clear storage', async () => {
            const options = createOptions();

            const { result } = renderHook(() => useStorageActions(options));

            await act(async () => {
                await result.current.handleReset();
            });

            expect(mockRecord).toHaveBeenCalledWith('ResetExcerpts');
            expect(options.reset).toHaveBeenCalled();
            expect(mockClearStorage).toHaveBeenCalledWith('excerpts');
        });

        it('should work with different storage keys', async () => {
            const options = createOptions({
                analytics: { download: 'DownloadShamela', reset: 'ResetShamela', save: 'SaveShamela' },
                storageKey: STORAGE_KEYS.shamela,
            });

            const { result } = renderHook(() => useStorageActions(options));

            await act(async () => {
                await result.current.handleReset();
            });

            expect(mockRecord).toHaveBeenCalledWith('ResetShamela');
            expect(mockClearStorage).toHaveBeenCalledWith('shamela');
        });
    });

    describe('memoization', () => {
        it('should return stable function references', async () => {
            const options = createOptions();

            const { result, rerender } = renderHook(() => useStorageActions(options));

            const { handleSave: save1, handleDownload: download1, handleReset: reset1 } = result.current;

            rerender();

            expect(result.current.handleSave).toBe(save1);
            expect(result.current.handleDownload).toBe(download1);
            expect(result.current.handleReset).toBe(reset1);
        });
    });
});
