import { cleanMultilines, normalizeSpaces, timeToSeconds } from 'bitaboom';
import packageJson from '@/../package.json';
import { compressJson, decompressFromStream } from '@/lib/compression';
import { LatestContractVersion, Markers } from '@/lib/constants';
import { uploadToHuggingFace } from '@/lib/network';
import { downloadAslFromS3, streamFromS3 } from '@/lib/s3';
import { mapDateToSeconds, mapUnixTimestampToSeconds, nowInSeconds } from '@/lib/time';
import type { Compilation, Excerpt, Heading } from '@/stores/excerptsStore/types';
import type { ScrapeResult, ScrapingEngine, WebPage } from '@/stores/webStore/types';
import type { LegacyCompilation } from './legacy';

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

type Wordpress = {
    scrapingEngine: ScrapingEngine;
    urlPattern: string;
    pages: Array<{
        accessed: string;
        body?: string;
        page: number;
        title: string;
        url?: string;
        publishTimestamp: string;
    }>;
};

export const migrateWordpress = async (id: string) => {
    const json: Wordpress = await Bun.file(`${id}.orig.json`).json();

    const pages = json.pages.map((p) => ({
        accessedAt: mapDateToSeconds(new Date(p.accessed)),
        ...(p.body && { content: cleanMultilines(normalizeSpaces(p.body)) }),
        ...(p.publishTimestamp && { metadata: { publishedAt: mapDateToSeconds(new Date(p.publishTimestamp)) } }),
        id: p.page,
        ...(p.title && { title: p.title }),
    })) satisfies WebPage[];

    const result = {
        contractVersion: LatestContractVersion.Web,
        createdAt: pages[0].accessedAt,
        lastUpdatedAt: nowInSeconds(),
        pages,
        postProcessingApps: [{ id: packageJson.name, timestamp: new Date(), version: packageJson.version }],
        type: 'web',
        urlPattern: json.urlPattern,
    } satisfies ScrapeResult;

    await Promise.all([
        Bun.write(`${id}.json`, JSON.stringify(result, null, 2)),
        Bun.write(`${id}.json.br`, compressJson(result)),
    ]);
};

type LegacyMetaWrapped = {
    metadata: { scrapingEngine: ScrapingEngine; urlPattern: string };
    pages: Array<{ accessed: string; body?: string; page: number; title: string; url?: string }>;
};

export const migrateMetaDataWrapped = (old: LegacyMetaWrapped) => {
    const pages: WebPage[] = [];

    let groupStart: number | null = null;
    let groupTitle: string | null = null;

    for (let i = 0; i < old.pages.length; i++) {
        const p = old.pages[i];
        const next = old.pages[i + 1];

        // Determine if this page is part of (or starts) a group of same-titled pages.
        // A group requires at least two subsequent pages with the same title.
        if (p.title && p.title === next?.title) {
            // Current and next share a title — start or continue a group.
            if (groupTitle !== p.title) {
                groupStart = p.page;
                groupTitle = p.title;
            }
        } else if (groupTitle && p.title === groupTitle) {
            // This is the last page in an active group (next differs or doesn't exist).
            // groupStart stays as-is for this final member.
        } else {
            // No match — reset.
            groupStart = null;
            groupTitle = null;
        }

        const url = p.url;
        const metadata = { ...(url && { url }), ...(groupStart !== null && { group: groupStart }) };

        pages.push({
            accessedAt: mapDateToSeconds(new Date(p.accessed)),
            ...(p.body && { content: normalizeSpaces(p.body) }),
            ...(Object.keys(metadata).length && { metadata }),
            id: p.page,
            ...(p.title && { title: p.title }),
        } satisfies WebPage);
    }

    return {
        contractVersion: LatestContractVersion.Web,
        createdAt: pages[0].accessedAt,
        lastUpdatedAt: nowInSeconds(),
        pages,
        postProcessingApps: [{ id: packageJson.name, timestamp: new Date(), version: packageJson.version }],
        scrapingEngine: old.metadata.scrapingEngine!,
        type: 'web',
        urlPattern: old.metadata.urlPattern,
    } satisfies ScrapeResult;
};

export const migrate = async (id: string, urlPattern: string) => {
    const { data, stats } = await downloadAslFromS3(
        {
            awsAccessKey: process.env.AWS_ACCESS_KEY!,
            awsBucket: process.env.AWS_BUCKET!,
            awsRegion: process.env.AWS_REGION!,
            awsSecretKey: process.env.AWS_SECRET_KEY!,
        },
        `${id}.json`,
    );

    const result = migrateFlatWebToObject(data as any, mapDateToSeconds(stats.lastModified), urlPattern);

    await Promise.all([
        Bun.write(`${id}.orig.json`, JSON.stringify(data, null, 2)),
        Bun.write(`${id}.json`, JSON.stringify(result, null, 2)),
        Bun.write(`${id}.json.br`, compressJson(result)),
    ]);

    console.log(`Wrote ${id}.json.br`);
};

export const migrateGzipped = async (id: string) => {
    const stream = streamFromS3(
        {
            awsAccessKey: process.env.AWS_ACCESS_KEY!,
            awsBucket: process.env.AWS_BUCKET!,
            awsRegion: process.env.AWS_REGION!,
            awsSecretKey: process.env.AWS_SECRET_KEY!,
        },
        `${id}.json.gz`,
    );

    const original = await decompressFromStream(stream, `${id}.orig.json`);
    const json = await Bun.file(original).json();

    const result = migrateMetaDataWrapped(json);

    await Promise.all([
        Bun.write(`${id}.json`, JSON.stringify(result, null, 2)),
        Bun.write(`${id}.json.br`, compressJson(result)),
    ]);
};

export const migrateLegacyCompilation = async (id: string) => {
    const e: LegacyCompilation = await Bun.file(`${id}.json`).json();

    const headings: Heading[] = (e.headings || []).map((h) => ({
        from: h.from,
        id: h.id,
        lastUpdatedAt: mapUnixTimestampToSeconds(h.lastUpdatedAt),
        nass: h.nass,
        text: h.text,
        translator: h.translator,
    }));

    const excerpts: Excerpt[] = e.excerpts.map((e) => ({
        from: e.from,
        id: e.id,
        lastUpdatedAt: mapUnixTimestampToSeconds(e.lastUpdatedAt),
        ...(e.type === 1 && { meta: { type: Markers.Book } }),
        ...(e.type === 2 && { meta: { type: Markers.Chapter } }),
        nass: e.arabic,
        text: e.translation,
        ...(e.to && { to: e.to }),
        translator: e.translator,
    }));

    const compilation = {
        collection: e.collection,
        contractVersion: LatestContractVersion.Excerpts,
        createdAt: mapUnixTimestampToSeconds(e.createdAt),
        excerpts,
        footnotes: [],
        headings,
        lastUpdatedAt: nowInSeconds(),
        options: e.options as any,
        postProcessingApps: [{ id: packageJson.name, timestamp: nowInSeconds(), version: packageJson.version }],
    } satisfies Compilation;

    await Bun.write('excerpts.json', JSON.stringify(compilation, null, 2));
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

//migrateGzipped('1383');
//migrateWordpress('1383');
//migrate('1951', 'https://al-albany.com/audios/content/{{page}}/1');
upload('1383');
//migrateLegacyCompilation('2578');
