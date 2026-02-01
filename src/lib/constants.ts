import type { LLMProvider } from 'bitaboom';
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

/**
 * Translation model options for the toggle group (auto-sorted by numeric value)
 * Colors include: base bg, selected bg, and opacity fade when unselected
 */
// Define the type for a single model
export type TranslationModel = { label: string; value: string; color: string; provider: LLMProvider };

export const TRANSLATION_MODELS = [
    { color: 'emerald', label: 'GPT 5o', provider: 'openai', value: '879' },
    { color: 'blue', label: 'Gemini 3.0 Pro', provider: 'gemini', value: '890' },
    { color: 'orange', label: 'Grok 4 Expert', provider: 'grok', value: '895' },
].sort((a, b) => Number(a.value) - Number(b.value)) as readonly TranslationModel[];

export const MASTER_PROMPT_ID = 'master_prompt';

export const LatestContractVersion = {
    Ajza: 'v0.1',
    Book: 'v1.0',
    Excerpts: 'v4.0',
    Juz: 'v3.0',
    Transcript: 'v1.1',
    Web: 'v1.0',
} as const;

/**
 * OPFS storage keys for session persistence.
 * Centralized to avoid typos and make key usage discoverable.
 */
export const STORAGE_KEYS = {
    ajza: 'ajza',
    excerpts: 'excerpts',
    juz: 'juz',
    ketab: 'ketab',
    shamela: 'shamela',
    transcript: 'transcript',
    web: 'web',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const DEFAULT_FILLER_WORDS = ['آآ', 'اه', 'ايه', 'وآآ', 'فآآ', 'مم', 'ها'];

export const DEFAULT_MAX_SECONDS_PER_SEGMENT = 240;

export const DEFAULT_MAX_SECONDS_PER_LINE = 30;

export const DEFAULT_MIN_WORDS_PER_SEGMENT = 10;

export const DEFAULT_SILENCE_GAP_THRESHOLD = 2;

export const REQUIRED_RAW_INPUT_FILES = [
    'mac.json',
    'structures.json',
    'surya.json',
] as const satisfies readonly (keyof RawInputFiles)[];

/**
 * Honorific symbols frequently encountered in Arabic texts.
 * SWS: ﷺ (صلى الله عليه وسلم)
 */
export const SWS_SYMBOL = 'ﷺ';

export const INTAHA_TYPO = 'اه';

export const INTAHA_ACTUAL = 'اهـ';

export const TRANSLATE_TRANSCRIPT_PROMPT = `Translate the following Arabic transcript into English with the highest accuracy, prioritizing literal translation unless a meaning-based approach is more appropriate.
Carefully analyze context to ensure correct usage of Islamic technical terms. Use ALA-LC transliteration for words best left untranslated, placing only their English meaning in parentheses.
Example: “This is a sentence with taqlīd (blind following) in it.” Do not enclose transliterated words in brackets.
Respond only with the translated plain text. Do not include any commentary from yourself or, markdown or extra formatting. Preserve full chains of narration.
The transcript will include the time segments, ensure your translated response includes these so they can be mapped back to the original Arabic. When a sentence continues from one segment to another, ensure considering the next segment for context in your translation.`;

export const TRANSLATE_DRAFT_TRANSCRIPT_PROMPT = `${TRANSLATE_TRANSCRIPT_PROMPT}\nThe transcript was generated using AI so it may not be 100% accurate. Any parts that sound like a typo or incorrect transcription, use your best judgment based on the context of what is before and after. Revise your translation THREE times before sending.
The first pass: Verify all translations are aligned with matching Arabic time markers.
The second pass: The translations are accurate based on the overall context.
The third pass: Any transliterations used are accurate.`;

// Footer and delimiters
export const FOOTNOTES_DELIMITER = '\n_\n';

// Segmentation analysis constants
export const SEGMENTATION_DEFAULT_TOP_K = 100;
export const SEGMENTATION_DEFAULT_PREFIX_CHARS = 120;
export const SEGMENTATION_DEFAULT_MIN_COUNT = 2;
export const SEGMENTATION_SIMILARITY_THRESHOLD = 0.7;
export const SEGMENTATION_FETCH_ALL_TOP_K = 10000;

/**
 * Minimum word count threshold for detecting short segments that can be merged.
 * Segments with fewer words than this are candidates for merging with adjacent segments.
 */
export const SHORT_SEGMENT_WORD_THRESHOLD = 30;

/**
 * Components for building translation marker regex patterns
 */

export enum Markers {
    Book = 'B',
    Footnote = 'F',
    Heading = 'T',
    Chapter = 'C',
    Note = 'N',
    Plain = 'P',
}

/**
 * Minimum Arabic text length (in characters) to consider for truncation detection.
 * Short texts are exempt to avoid false positives on single-word or brief phrases.
 */
export const MIN_ARABIC_LENGTH_FOR_TRUNCATION_CHECK = 50;

/**
 * Minimum expected translation ratio (translation length / Arabic length).
 *
 * Research on Arabic↔English translation shows:
 * - Word count: Arabic → English typically EXPANDS by 20-25%
 * - Character count: Roughly similar or slightly expanded
 *
 * A ratio of 0.25 means we flag translations under 25% of the Arabic length.
 * This is deliberately conservative to catch obvious truncation while avoiding false positives.
 */
export const MIN_TRANSLATION_RATIO = 0.25;

/**
 * Maximum consecutive gaps to flag as issues.
 * More than this many consecutive missing items are likely untranslated sections.
 */
export const MAX_CONSECUTIVE_GAPS_TO_FLAG = 3;
