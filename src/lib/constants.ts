import type { RawInputFiles } from '@/stores/manuscriptStore/types';

export const DEFAULT_HINTS = [
    'احسن الله اليكم',
    'جزاك الله',
    'احسن الله اليك',
    'بسم الله الرحمن',
    'وصلى الله وسلم على نبينا محمد',
    'اما بعد',
    'جزاكم الله خيرا',
];

export const DEFAULT_FILLER_WORDS = ['آآ', 'اه', 'ايه', 'وآآ', 'فآآ', 'مم', 'ها'];

export const DEFAULT_MAX_SECONDS_PER_SEGMENT = 240;

export const DEFAULT_MAX_SECONDS_PER_LINE = 30;

export const DEFAULT_MIN_WORDS_PER_SEGMENT = 10;

export const DEFAULT_SILENCE_GAP_THRESHOLD = 2;

export const TRANSCRIPT_CONTRACT_LATEST = 'v1.0';

export const BOOK_CONTRACT_LATEST = 'v1.0';

export const REQUIRED_RAW_INPUT_FILES = [
    'batch_output.json',
    'structures.json',
    'surya.json',
    'page_size.txt',
] as const satisfies readonly (keyof RawInputFiles)[];

/**
 * Honorific symbols frequently encountered in Arabic texts.
 * SWS: ﷺ (صلى الله عليه وسلم)
 * AZW: ﷻ (عز وجل)
 */
export const SWS_SYMBOL = 'ﷺ';

export const AZW_SYMBOL = 'ﷻ';
