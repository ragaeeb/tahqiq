import { describe, expect, it, mock } from 'bun:test';

// Mock S3Client
const mockJson = mock(() => Promise.resolve({ some: 'data' }));
const mockStat = mock((_path: string) => Promise.resolve({ size: 123 }));
const mockFile = mock((_path: string) => ({ json: mockJson }));

class MockS3Client {
    file(path: string) {
        return mockFile(path);
    }
    stat(path: string) {
        return mockStat(path);
    }
}

mock.module('@/lib/bun-s3', () => ({ S3Client: MockS3Client }));

describe('downloadAslFromS3', () => {
    it('should download JSON and get stats from S3', async () => {
        const { downloadAslFromS3 } = await import('./s3');
        const config = { awsAccessKey: 'key', awsBucket: 'bucket', awsRegion: 'region', awsSecretKey: 'secret' };

        const result = await downloadAslFromS3(config, 'path/to/file.json');

        expect(result as any).toEqual({ data: { some: 'data' }, stats: { size: 123 } });

        expect(mockFile).toHaveBeenCalledWith('path/to/file.json');
        expect(mockStat).toHaveBeenCalledWith('path/to/file.json');
        expect(mockJson).toHaveBeenCalled();
    });
});
