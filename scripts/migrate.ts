import packageJson from '@/../package.json';
import { compressJson } from '@/lib/compression';
import { LatestContractVersion } from '@/lib/constants';
import { uploadToHuggingFace } from '@/lib/network';
import { downloadAslFromS3 } from '@/lib/s3';
import { mapDateToSeconds, nowInSeconds, timeToSeconds } from '@/lib/time';
import type { ScrapeResult, WebPage } from '@/stores/webStore/types';

type LegacyFlatWeb = Array<{ body: string; title: string; part: string; metadata: string; page: number }>;

export const migrateFlatWebToObject = (
    old: LegacyFlatWeb,
    lastUpdatedAt: number,
    urlPattern: string,
    prefix = 'توقيت الفهرسة : ',
) => {
    const pages = old.map((p) => {
        const [title, ...rest] = p.body.split('\n');

        return {
            accessedAt: lastUpdatedAt,
            content: rest.join('\n'),
            id: p.page,
            metadata: { part: Number(p.part), t: timeToSeconds(p.metadata.substring(prefix.length)) },
            title,
        } satisfies WebPage;
    });

    return {
        contractVersion: LatestContractVersion.Web,
        createdAt: lastUpdatedAt,
        lastUpdatedAt: nowInSeconds(),
        pages,
        postProcessingApps: [{ id: packageJson.name, timestamp: new Date(), version: packageJson.version }],
        type: 'web',
        urlPattern,
    } satisfies ScrapeResult;
};

export const migrate = async (id: string) => {
    const { data, stats } = await downloadAslFromS3(
        {
            awsAccessKey: process.env.AWS_ACCESS_KEY!,
            awsBucket: process.env.AWS_BUCKET!,
            awsRegion: process.env.AWS_REGION!,
            awsSecretKey: process.env.AWS_SECRET_KEY!,
        },
        `${id}.json`,
    );

    const result = migrateFlatWebToObject(
        data as any,
        mapDateToSeconds(stats.lastModified),
        'https://al-albany.com/audios/content/{{page}}/1',
    );

    await Bun.write(`${id}.json.br`, compressJson(result));

    console.log(`Wrote ${id}.json.br`);
};

export const upload = async (id: string) => {
    const fileBlob = new Blob([await Bun.file(`${id}.json.br`).arrayBuffer()]);

    await uploadToHuggingFace({
        fileBlob,
        pathInRepo: `${id}.json.br`,
        repoId: process.env.HF_TRANSLATIONS_REPO!,
        token: process.env.HF_TOKEN!,
    });
};

//migrate('1242');
upload('1242');
