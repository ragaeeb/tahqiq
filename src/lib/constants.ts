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

export const LatestContractVersion = {
    Ajza: 'v0.1',
    Book: 'v1.0',
    Excerpts: 'v3.0',
    Juz: 'v3.0',
    Transcript: 'v1.1',
} as const;

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

export const TRANSLATE_BOOK_PROMPT = `Translate the following Arabic text into English with the highest accuracy, prioritizing literal translation unless a meaning-based approach is more appropriate.
Carefully analyze context to ensure correct usage of Islamic technical terms. Keep at most a single line-break character between lines.
Use ALA-LC transliteration for words best left untranslated, placing only their English meaning in parentheses.
Example: “This is a sentence with taqlīd (blind following) in it.” Do not enclose transliterated words in brackets.
Respond only with the translated plain text—no commentary or, markdown or extra formatting. Preserve full chains of narration.
The text will include a page ID (pN or fN) before each text content, ensure your translated response includes these so they can be mapped back to the original Arabic. When a sentence continues from one page to another, consider the next page for context in your translation. Revise your translation 3 times before sending.`;

export const TRANSLATE_TRANSCRIPT_PROMPT = `Translate the following Arabic transcript into English with the highest accuracy, prioritizing literal translation unless a meaning-based approach is more appropriate.
Carefully analyze context to ensure correct usage of Islamic technical terms. Use ALA-LC transliteration for words best left untranslated, placing only their English meaning in parentheses.
Example: “This is a sentence with taqlīd (blind following) in it.” Do not enclose transliterated words in brackets.
Respond only with the translated plain text. Do not include any commentary from yourself or, markdown or extra formatting. Preserve full chains of narration.
The transcript will include the time segments, ensure your translated response includes these so they can be mapped back to the original Arabic. When a sentence continues from one segment to another, ensure considering the next segment for context in your translation.`;

export const TRANSLATE_DRAFT_TRANSCRIPT_PROMPT = `${TRANSLATE_TRANSCRIPT_PROMPT}\nThe transcript was generated using AI so it may not be 100% accurate. Any parts that sound like a typo or incorrect transcription, use your best judgment based on the context of what is before and after. Revise your translation 3 times before sending.`;

export const TRANSLATE_EXCERPTS_PROMPT = [
    `You are a professional Arabic to English translator who specializes in Islāmic content.`,
    `You will be translating from the book: {{book}}.`,
    'Translate the following Arabic text into English with the highest level of accuracy preferring literal translations except when the context fits to translate by meaning.',
    'Carefully analyze the context to ensure the correct usage of Islamic technical terminology.',
    'Preserve full chains of narration and use ALA-LC transliteration only on the names of the narrators in the chain but not the textual content. "حَدَّثَنَا مُحَمَّدُ" would translate to "Muḥammad narrated to us". Translate chapter headings, poetry and verses as well.',
    'Translate "God" as Allah unless the Arabic is actually refering to an ilāh. Whenever صلى الله عليه وسلم is used translate it with ﷺ. There should be no Arabic characters in your response other than this one.',
    'Respond only in plain-text, no markdown or formatting. Keep the IDs (B1, C2, T33, P44, P44a, etc.) that appear in the beginning of each segment. Do NOT attempt to correct the numeric prefixes if they seem out of order or assume continuity from one to another.',
    'Revise your translation THREE times before sending it back:',
    'The first pass: Verify all translations are aligned with matching Arabic numeric markers.',
    'The second pass: The translations are accurate based on the overall context.',
    'The third pass: Any transliterations used are accurate.',
    'CRITICAL: Never format chapter headings into all uppercase.',
];

export const FOOTNOTES_DELIMITER = '\n_\n';
