import type { Juz, ManuscriptStateCore } from '@/stores/manuscriptStore/types';

import packageJson from '@/../package.json';

import { LatestContractVersion } from './constants';

export const mapManuscriptToJuz = (state: ManuscriptStateCore): Juz => {
    return {
        contractVersion: LatestContractVersion.Juz,
        postProcessingApps: state.postProcessingApps.concat({
            id: packageJson.name,
            timestamp: new Date(),
            version: packageJson.version,
        }),
        sheets: state.sheets,
        timestamp: state.createdAt,
        type: 'juz',
        ...(state.url && { url: state.url }),
    };
};
