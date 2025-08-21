import type { Juz, ManuscriptStateCore, Sheet } from '@/stores/manuscriptStore/types';

import packageJson from '@/../package.json';

import { LatestContractVersion } from './constants';
import { roundToDecimal } from './time';

export const mapManuscriptToJuz = (state: ManuscriptStateCore): Juz => {
    const sheets = state.sheets.map((s) => ({
        alt: s.alt,
        observations: s.observations.map(({ bbox, id, lastUpdate, ...o }) => ({
            ...o,
            bbox: {
                height: roundToDecimal(bbox.height),
                width: roundToDecimal(bbox.width),
                x: roundToDecimal(bbox.x),
                y: roundToDecimal(bbox.y),
            },
        })),
        page: s.page,
    })) as unknown as Sheet[];

    return {
        contractVersion: LatestContractVersion.Juz,
        postProcessingApps: state.postProcessingApps.concat({
            id: packageJson.name,
            timestamp: new Date(),
            version: packageJson.version,
        }),
        sheets,
        timestamp: state.createdAt,
        type: 'juz',
        ...(state.url && { url: state.url }),
    };
};
