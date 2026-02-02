import type { Readable } from 'node:stream';
import { S3Client } from '@/lib/bun-s3';

type S3Config = { awsAccessKey: string; awsBucket: string; awsRegion: string; awsSecretKey: string };

export const downloadAslFromS3 = async <T>(config: S3Config, filePath: string) => {
    const s3Client = new S3Client({
        accessKeyId: config.awsAccessKey,
        bucket: config.awsBucket,
        region: config.awsRegion,
        secretAccessKey: config.awsSecretKey,
    });

    const [data, stats] = await Promise.all([s3Client.file(filePath).json(), s3Client.stat(filePath)]);
    return { data: data as T, stats };
};

export const streamFromS3 = (config: S3Config, filePath: string) => {
    const s3Client = new S3Client({
        accessKeyId: config.awsAccessKey,
        bucket: config.awsBucket,
        region: config.awsRegion,
        secretAccessKey: config.awsSecretKey,
    });

    return s3Client.file(filePath).stream() as unknown as Readable;
};
