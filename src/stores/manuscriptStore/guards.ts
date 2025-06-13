import { REQUIRED_RAW_INPUT_FILES } from '@/lib/constants';

import type { RawInputFiles } from './types';

export function assertHasRequiredFiles(obj: Record<string, unknown>): asserts obj is RawInputFiles {
    for (const name of REQUIRED_RAW_INPUT_FILES) {
        if (!(name in obj)) {
            throw new Error(`Missing required input file: ${name}`);
        }
    }
}
