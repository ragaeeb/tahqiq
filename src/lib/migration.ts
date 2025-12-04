import type { Entry, Excerpt, Excerpts, Heading } from '@/stores/excerptsStore/types';

/**
 * Legacy Excerpts format (v2.x) with Entry type
 */
type LegacyExcerpts = Omit<Excerpts, 'excerpts' | 'headings'> & { excerpts: Entry[]; headings: LegacyHeading[] };

/**
 * Legacy Heading format without AITranslation fields
 */
type LegacyHeading = {
    from: number;
    id: string;
    lastUpdatedAt?: number;
    nass: string;
    parent?: string;
    text?: string;
    translator: number;
};

/**
 * Migrates a legacy Entry to the new Excerpt format
 */
const migrateEntry = (entry: Entry): Excerpt => {
    return {
        from: entry.from,
        id: entry.id,
        lastUpdatedAt: entry.lastUpdatedAt! / 1000,
        nass: entry.arabic!,
        text: entry.translation!,
        to: entry.to,
        translator: entry.translator!,
        vol: entry.volume,
        vp: entry.pp, // Position/paragraph → volume page
    };
};

/**
 * Migrates a legacy Heading to the new Heading format with AITranslation
 */
const migrateHeading = (heading: LegacyHeading): Heading => {
    return {
        from: heading.from,
        id: heading.id,
        lastUpdatedAt: heading.lastUpdatedAt! / 1000,
        nass: heading.nass,
        parent: heading.parent,
        text: heading.text!,
        translator: heading.translator,
    };
};

/**
 * Migrates legacy Excerpts (v2.x) to the new format (v3.0)
 * Converts Entry[] to Excerpt[] and updates Heading format
 */
const migrateExcerpts = (data: LegacyExcerpts): Excerpts => {
    return {
        ...data,
        contractVersion: 'v3.0',
        excerpts: data.excerpts.map(migrateEntry),
        headings: data.headings.map(migrateHeading),
        lastUpdatedAt: Date.now(),
    };
};

/**
 * Adapts incoming data to the latest format, migrating if necessary
 */
export const adaptExcerptsToLatest = (data: unknown): Excerpts => {
    const excerpts = data as Excerpts | LegacyExcerpts;

    if (!excerpts.contractVersion?.startsWith('v3.')) {
        return migrateExcerpts(excerpts as LegacyExcerpts);
    }

    return excerpts as Excerpts;
};
