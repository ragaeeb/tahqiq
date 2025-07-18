import type { Juz, ManuscriptStateCore } from '@/stores/manuscriptStore/types';

import { LatestContractVersion } from './constants';

export const mapManuscriptToJuz = (manuscriptState: ManuscriptStateCore): Juz => {
    return {
        contractVersion: LatestContractVersion.Juz,
        sheets: manuscriptState.sheets,
        timestamp: new Date(),
        type: 'juz',
    };
};
