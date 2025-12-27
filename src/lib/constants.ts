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
export const TRANSLATION_MODELS = [
    { color: 'emerald', label: 'OpenAI GPT 5', value: '879' },
    { color: 'blue', label: 'Gemini 3.0 Pro', value: '890' },
    { color: 'orange', label: 'Claude 4.5 Sonnet', value: '891' },
    { color: 'purple', label: 'Grok 4.1 Thinking Beta', value: '892' },
    { color: 'green', label: 'OpenAI GPT 5.2 Thinking', value: '893' },
].sort((a, b) => Number(a.value) - Number(b.value)) as readonly { label: string; value: string; color: string }[];

export const LatestContractVersion = {
    Ajza: 'v0.1',
    Book: 'v1.0',
    Excerpts: 'v3.0',
    Juz: 'v3.0',
    Transcript: 'v1.1',
} as const;

/**
 * OPFS storage keys for session persistence.
 * Centralized to avoid typos and make key usage discoverable.
 */
export const STORAGE_KEYS = {
    ajza: 'ajza',
    excerpts: 'excerpts',
    juz: 'juz',
    shamela: 'shamela',
    transcript: 'transcript',
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

export const TRANSLATE_DRAFT_TRANSCRIPT_PROMPT = `${TRANSLATE_TRANSCRIPT_PROMPT}\nThe transcript was generated using AI so it may not be 100% accurate. Any parts that sound like a typo or incorrect transcription, use your best judgment based on the context of what is before and after. Revise your translation THREE times before sending.
The first pass: Verify all translations are aligned with matching Arabic time markers.
The second pass: The translations are accurate based on the overall context.
The third pass: Any transliterations used are accurate.`;

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

export const SEGMENT_PROMPT = `You are an expert in Arabic text segmentation and you know the TypeScript library flappa-doormal. Your job is to help me generate segmentation rules that I can pass to segmentPages(pages, options) to split Shamela book pages into logical segments (books/chapters/sections/hadiths/masā’il/biography entries/etc).
I will paste a random subset of pages from a Shamela book. Each page will have:
id (page number, not necessarily consecutive)
content (plain text; line breaks may be \n)
Your output must be only a JSON object I can copy into TypeScript as SegmentationOptions (no prose), using this shape:
rules: array of SplitRule objects. Each rule must use exactly one of:
lineStartsWith: string[]
lineStartsAfter: string[] (marker excluded from content)
lineEndsWith: string[]
template: string (regex string)
regex: string (raw regex string)
Optional per rule:
split: "at" or "after" (default is "at")
meta: object (e.g. { type: "chapter" })
min: number (apply rule only when page id >= min)
max: number (apply rule only when page id <= max)
exclude: list of page numbers/ranges to skip for this rule (e.g. [1, [10,15]])
occurrence: "first" or "last" (optional; use if needed)
fuzzy: boolean (use for Arabic headings where diacritics vary)
Global options (optional):
maxPages: number (maximum pages a segment can span before breakpoints)
breakpoints: ordered array of breakpoints (strings or objects { pattern, min?, max?, exclude? })
Breakpoint patterns can use token templates and are applied after structural segmentation
Empty string "" means “fall back to page boundary”
prefer: "longer" or "shorter" for breakpoints matching in window
IMPORTANT: Available template tokens
You can use these inside lineStartsWith, lineStartsAfter, lineEndsWith, template, and breakpoint pattern strings:
{{basmalah}} matches بسم الله or ﷽
{{bab}} matches باب
{{kitab}} matches كتاب
{{fasl}} matches مسألة|فصل
{{naql}} matches narration phrases like حدثنا|أخبرنا|حدثني|سمعت|...
{{raqm}} Arabic-Indic digit [٠-٩]
{{raqms}} one or more Arabic-Indic digits
{{dash}} dash variants - – — ـ
{{tarqim}} punctuation [.!?؟؛]
{{harf}} Arabic letter [أ-ي]
{{harfs}} abbreviation chunks like د ت سي ق, خ سي, دق, خت (short letter codes, optional spaces)
Named captures:
{{raqms:num}} captures digits into segment.meta.num
{{harfs:rumuz}} captures abbreviation chunk into segment.meta.rumuz
{{:name}} captures arbitrary text into segment.meta[name]
What you need to do
Given the sample pages I provide, do ALL of the following:
1) Identify the document structure:
Does it have “book” headers (كتاب)?
“chapter” headers (باب)?
“section/issue” markers (فصل / مسألة)?
Hadith numbering like ١٢٣ - ... or similar?
Biographical entry format like ١١٢٨ ع: ... (number + abbreviation codes + colon)?
Markdown-like titles like ## ...? (sometimes my pipeline converts HTML titles to ##)
2) Propose a robust set of rules that:
Splits at the most meaningful structural boundaries first (book/chapter/section).
Captures useful metadata (e.g., hadith/entry numbers) using named captures where applicable.
Avoids accidental splits caused by common words appearing in body text.
Works across pages (rules match across the concatenated text with ^ meaning line start because the library uses multiline matching).
3) Provide guardrails using constraints:
Use min/max when early pages are front matter with different formatting.
Use exclude for known noisy pages (like title pages) if the sample shows it.
Use occurrence: "first" or "last" only if it clearly improves accuracy.
4) Choose whether to apply breakpoints:
If segments can span many pages (e.g. long chapters), set maxPages and breakpoints.
Use breakpoints that preserve readability:
First choice: {{tarqim}}\\s* (split after punctuation)
Next: \\n (split on newline)
Fallback: "" (page boundary)
Set prefer: "longer" unless there is a strong reason to keep segments shorter.
5) Keep rules minimal but effective:
Prefer lineStartsWith / lineStartsAfter for common structural markers.
Use lineStartsAfter when the marker should NOT appear in segment.content (e.g. stripping ١٢٣ - ).
Use fuzzy: true for Arabic headings like كتاب/باب when diacritics vary; do NOT use fuzzy where the pattern is mostly regex metacharacters.
6) Output requirements
Your output must be a single JSON object with:
rules (required)
Optional: maxPages, breakpoints, prefer
No comments, no extra explanation, no code fences.
Input format you will receive from me
I will paste something like:
PAGE 107:
<text...>
PAGE 108:
<text...>
... etc.
You must infer patterns from this subset and generalize them.
Extra caution
Do NOT create rules that match mid-line unless you intentionally use regex/template without ^.
Beware: {{harfs}} is for abbreviation codes, not arbitrary words.
If you use regex rules with captures, understand:
Named groups (?<name>...) become metadata
Anonymous ( ... ) groups can affect which part is treated as “content”
When in doubt, prefer simpler lineStartsWith/After patterns using tokens.
Now wait for the sample pages.
`;

// Segmentation analysis constants
export const SEGMENTATION_DEFAULT_TOP_K = 100;
export const SEGMENTATION_DEFAULT_PREFIX_CHARS = 120;
export const SEGMENTATION_DEFAULT_MIN_COUNT = 2;
export const SEGMENTATION_SIMILARITY_THRESHOLD = 0.7;
export const SEGMENTATION_FETCH_ALL_TOP_K = 10000;
