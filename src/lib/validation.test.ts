import { describe, expect, it } from 'bun:test';
import {
    detectEmptyParentheses,
    detectTruncatedTranslation,
    extractIdNumber,
    extractIdPrefix,
    extractTranslationIds,
    normalizeTranslationText,
    validateNumericOrder,
    validateTranslationMarkers,
    validateTranslationOrder,
    validateTranslations,
} from './validation';

describe('Translation Validation Utilities', () => {
    describe('validateTranslationMarkers', () => {
        it('should return undefined for valid markers', () => {
            const text = `P11622a - Some translation
C123 - Another translation
B45b - Third one`;
            expect(validateTranslationMarkers(text)).toBeUndefined();
        });

        it('should detect invalid reference format with characters in middle', () => {
            const text = 'B12a34 - Invalid format';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('Invalid reference format');
            expect(error).toContain('B12a34');
        });

        it('should detect dollar sign in reference', () => {
            const text = 'B1234$5 - Invalid with dollar';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('$');
        });

        it('should detect empty content after dash', () => {
            const text = 'P123 -';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('no content after it');
        });

        it('should detect empty content after dash with whitespace', () => {
            const text = 'P123 -   ';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('no content after it');
        });

        it('should allow valid suffixes a-j', () => {
            const text = `P123a - Valid
P456b - Also valid
P789j - Still valid`;
            expect(validateTranslationMarkers(text)).toBeUndefined();
        });

        it('should detect multi-letter suffix with space before', () => {
            const text = 'Some text P123ab - Translation';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('Suspicious reference');
        });
    });

    describe('detectEmptyParentheses', () => {
        it('should return undefined for text without empty parentheses', () => {
            const text = 'This is normal text (with content) in parentheses.';
            expect(detectEmptyParentheses(text)).toBeUndefined();
        });

        it('should return undefined for text with 3 or fewer empty parentheses', () => {
            const text = 'First () then () and ().';
            expect(detectEmptyParentheses(text)).toBeUndefined();
        });

        it('should return undefined for exactly 3 empty parentheses', () => {
            const text = 'One () two () three ()';
            expect(detectEmptyParentheses(text)).toBeUndefined();
        });

        it('should detect more than 3 empty parentheses', () => {
            const text = 'First () then () and () plus () more.';
            const error = detectEmptyParentheses(text);
            expect(error).toBeDefined();
            expect(error).toContain('4 empty parentheses');
            expect(error).toContain('failed transliterations');
        });

        it('should detect many empty parentheses in realistic LLM output', () => {
            const text = `P123 - Therefore, the word "thirty-three" is idle talk () here, because

then the preponderant opinion () for them becomes what they call "observance of interest" ()—observing what

These () are generally transliterations but sometimes the LLM chokes in producing them so it puts it as ().

Another example () of this pattern.`;
            const error = detectEmptyParentheses(text);
            expect(error).toBeDefined();
            expect(error).toContain('empty parentheses');
        });

        it('should not count parentheses with content', () => {
            const text = 'Word (Arabic) and (more Arabic) and (yet more) and (this too) and (also this).';
            expect(detectEmptyParentheses(text)).toBeUndefined();
        });

        it('should return undefined for empty text', () => {
            expect(detectEmptyParentheses('')).toBeUndefined();
        });
    });

    describe('normalizeTranslationText', () => {
        it('should split merged markers onto separate lines', () => {
            const input = 'P123 - First translation P456 - Second translation';
            const result = normalizeTranslationText(input);
            expect(result).toContain('\nP456 -');
        });

        it('should handle multiple merged markers', () => {
            const input = 'P1 - First P2 - Second P3 - Third';
            const result = normalizeTranslationText(input);
            const lines = result.split('\n');
            expect(lines.length).toBe(3);
        });

        it('should preserve already-separated markers', () => {
            const input = `P123 - First
P456 - Second`;
            const result = normalizeTranslationText(input);
            expect(result).toBe(input);
        });

        it('should replace escaped brackets', () => {
            const input = 'P123 - Text with \\[brackets\\]';
            const result = normalizeTranslationText(input);
            expect(result).toContain('[brackets');
        });

        it('should handle en dash and em dash', () => {
            const input = 'P1 – First P2 — Second';
            const result = normalizeTranslationText(input);
            expect(result.split('\n').length).toBe(2);
        });

        it('should split markers with no space before them (period directly before marker)', () => {
            const input = 'P6821 - Questioner: This is the answer.P6822 - Next question';
            const result = normalizeTranslationText(input);
            expect(result).toContain('\nP6822 -');
            expect(result.split('\n').length).toBe(2);
        });

        it('should handle complex mid-sentence markers', () => {
            const input = `P6821 - Questioner: This is the answer to that question.P6822 - Questioner: What is the ruling of the sharīʿah (Islamic law) on religious anāshīd (chants) and beating the dufūf (plural of daff, frame drums) and is the daff (frame drum) specific to women without men?
The Shaykh: Attach, attach the answer to the Islamic banks.P6823 - Questioner: The father, meaning we advised him`;
            const result = normalizeTranslationText(input);
            // Each marker should start on its own line now
            expect(result).toMatch(/^P6821 -/m);
            expect(result).toMatch(/^P6822 -/m);
            expect(result).toMatch(/^P6823 -/m);
            // Verify we can extract all 3 IDs
            const ids = extractTranslationIds(result);
            expect(ids).toEqual(['P6821', 'P6822', 'P6823']);
        });

        it('should normalize Windows-style CRLF line endings to LF', () => {
            const input = 'P1 - First\r\nP2 - Second\r\nP3 - Third';
            const result = normalizeTranslationText(input);
            expect(result).not.toContain('\r');
            expect(result).toContain('\n');
            const ids = extractTranslationIds(result);
            expect(ids).toEqual(['P1', 'P2', 'P3']);
        });

        it('should normalize old Mac-style CR line endings to LF', () => {
            const input = 'P1 - First\rP2 - Second\rP3 - Third';
            const result = normalizeTranslationText(input);
            expect(result).not.toContain('\r');
            const ids = extractTranslationIds(result);
            expect(ids).toEqual(['P1', 'P2', 'P3']);
        });

        it('should handle mixed line endings (CRLF and markers without spacing)', () => {
            const input = 'P6821 - Answer to question.P6822 - Next question\r\nThe Shaykh: response.P6823 - Another';
            const result = normalizeTranslationText(input);
            expect(result).not.toContain('\r');
            const ids = extractTranslationIds(result);
            expect(ids).toEqual(['P6821', 'P6822', 'P6823']);
        });
    });

    describe('extractTranslationIds', () => {
        it('should extract IDs in order', () => {
            const text = `P11622a - First
C11623 - Second
B100 - Third`;
            const ids = extractTranslationIds(text);
            expect(ids).toEqual(['P11622a', 'C11623', 'B100']);
        });

        it('should handle mixed prefixes', () => {
            const text = `F1 - Footnote
T2 - Title
N3 - Note`;
            const ids = extractTranslationIds(text);
            expect(ids).toEqual(['F1', 'T2', 'N3']);
        });

        it('should return empty array for no markers', () => {
            const text = 'Just some random text without markers';
            const ids = extractTranslationIds(text);
            expect(ids).toEqual([]);
        });

        it('should handle suffixes correctly', () => {
            const text = `P1a - With suffix
P2 - Without suffix
P3c - Another suffix`;
            const ids = extractTranslationIds(text);
            expect(ids).toEqual(['P1a', 'P2', 'P3c']);
        });
    });

    describe('extractIdNumber', () => {
        it('should extract number from simple ID', () => {
            expect(extractIdNumber('P123')).toBe(123);
        });

        it('should extract number from ID with suffix', () => {
            expect(extractIdNumber('P11622a')).toBe(11622);
        });

        it('should extract number from various prefixes', () => {
            expect(extractIdNumber('C456')).toBe(456);
            expect(extractIdNumber('B789')).toBe(789);
            expect(extractIdNumber('F100b')).toBe(100);
        });

        it('should return 0 for invalid ID', () => {
            expect(extractIdNumber('Invalid')).toBe(0);
        });
    });

    describe('extractIdPrefix', () => {
        it('should extract prefix from various IDs', () => {
            expect(extractIdPrefix('P123')).toBe('P');
            expect(extractIdPrefix('C456a')).toBe('C');
            expect(extractIdPrefix('B789')).toBe('B');
            expect(extractIdPrefix('F100b')).toBe('F');
        });
    });

    describe('validateNumericOrder', () => {
        it('should return undefined for correct numeric order', () => {
            const ids = ['P1', 'P2', 'P3'];
            expect(validateNumericOrder(ids)).toBeUndefined();
        });

        it('should return undefined for single ID', () => {
            expect(validateNumericOrder(['P1'])).toBeUndefined();
        });

        it('should return undefined for empty list', () => {
            expect(validateNumericOrder([])).toBeUndefined();
        });

        it('should detect out of numeric order - user reported case', () => {
            // This is the exact case the user reported: P12659 before P12651
            const ids = ['P12659', 'P12651'];
            const error = validateNumericOrder(ids);
            expect(error).toContain('P12651');
            expect(error).toContain('12651');
            expect(error).toContain('P12659');
            expect(error).toContain('12659');
        });

        it('should detect descending order', () => {
            const ids = ['P100', 'P50', 'P25'];
            const error = validateNumericOrder(ids);
            expect(error).toContain('P50');
            expect(error).toContain('appears after');
        });

        it('should allow different prefixes to have independent order', () => {
            // C500 can come after P100 even though 500 > 100 - different prefix
            const ids = ['P100', 'C500', 'P200'];
            expect(validateNumericOrder(ids)).toBeUndefined();
        });

        it('should detect order issue within same prefix across mixed IDs', () => {
            // P200 comes after P100, but P50 after P200 is wrong
            const ids = ['P100', 'C500', 'P200', 'C600', 'P50'];
            const error = validateNumericOrder(ids);
            expect(error).toContain('P50');
        });
    });

    describe('validateTranslationOrder', () => {
        // Store order: P1, P2, P6, P8, P10, P20
        const expectedIds = ['P1', 'P2', 'P6', 'P8', 'P10', 'P20'];

        it('should return undefined for correct order', () => {
            const translationIds = ['P1', 'P2', 'P6'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        it('should return undefined for empty expected list (no store data)', () => {
            const ids = ['P12659', 'P12651'];
            expect(validateTranslationOrder(ids, [])).toBeUndefined();
        });

        it('should allow one reset (two blocks)', () => {
            // P6->P8->P10->P20 valid, then reset to P1->P2 valid
            const translationIds = ['P6', 'P8', 'P10', 'P20', 'P1', 'P2'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        it('should allow multiple resets (three blocks)', () => {
            // P8->P10 valid, reset to P6->P20, reset to P1->P2
            const translationIds = ['P8', 'P10', 'P6', 'P20', 'P1', 'P2'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        it('should allow many blocks out of global order', () => {
            // P10->P20 valid, reset to P1->P2, reset to P6->P8
            const translationIds = ['P10', 'P20', 'P1', 'P2', 'P6', 'P8'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        it('should return undefined for empty translation list', () => {
            expect(validateTranslationOrder([], expectedIds)).toBeUndefined();
        });

        it('should handle IDs not in expected list gracefully', () => {
            const translationIds = ['P1', 'X999', 'P2'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        it('should allow non-consecutive IDs that are in store order', () => {
            // P1, P6, P20 - skipping P2, P8, P10 is fine as long as order is maintained
            const translationIds = ['P1', 'P6', 'P20'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });
    });

    describe('validateTranslations', () => {
        const expectedIds = ['P1', 'P2', 'P3', 'P4', 'P5'];

        it('should return valid result for correct translations', () => {
            const text = `P1 - First translation
P2 - Second translation
P3 - Third translation`;
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
            expect(result.parsedIds).toEqual(['P1', 'P2', 'P3']);
        });

        it('should normalize merged markers before validation', () => {
            const text = 'P1 - First P2 - Second P3 - Third';
            const result = validateTranslations(text, expectedIds);
            expect(result.normalizedText).toContain('\n');
            expect(result.parsedIds).toEqual(['P1', 'P2', 'P3']);
        });

        it('should return error for invalid marker format', () => {
            const text = 'P1$2 - Invalid marker';
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('$');
        });

        it('should return error for no valid markers', () => {
            const text = 'Just some text without any markers';
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('No valid translation markers');
        });

        it('should allow one reset in order - block pasting is valid', () => {
            // P4 then P1 is one reset, which is allowed
            const text = `P4 - Fourth
P5 - Fifth
P1 - First`;
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(true);
        });

        it('should allow multiple resets - user case', () => {
            // Multiple blocks are now allowed
            const text = `P4 - Fourth
P2 - Second
P5 - Fifth
P1 - First`;
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(true);
        });

        it('should handle complex multi-line translations', () => {
            const text = `P1 - First translation
with multiple lines
still P1 content

P2 - Second translation

P3 - Third`;
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(true);
            expect(result.parsedIds).toEqual(['P1', 'P2', 'P3']);
        });
    });
});

// Import and test findUnmatchedTranslationIds
import { findUnmatchedTranslationIds } from './validation';

describe('findUnmatchedTranslationIds', () => {
    const storeIds = ['P1', 'P2', 'P3', 'C10', 'C11', 'B100'];

    it('should return empty array when all IDs match', () => {
        const translationIds = ['P1', 'P2', 'C10'];
        expect(findUnmatchedTranslationIds(translationIds, storeIds)).toEqual([]);
    });

    it('should return unmatched IDs', () => {
        const translationIds = ['P1', 'P99', 'C11', 'X999'];
        const unmatched = findUnmatchedTranslationIds(translationIds, storeIds);
        expect(unmatched).toEqual(['P99', 'X999']);
    });

    it('should return all IDs when none match', () => {
        const translationIds = ['Z1', 'Z2', 'Z3'];
        expect(findUnmatchedTranslationIds(translationIds, storeIds)).toEqual(['Z1', 'Z2', 'Z3']);
    });

    it('should return empty array for empty translation IDs', () => {
        expect(findUnmatchedTranslationIds([], storeIds)).toEqual([]);
    });

    it('should return all IDs when store is empty', () => {
        const translationIds = ['P1', 'P2'];
        expect(findUnmatchedTranslationIds(translationIds, [])).toEqual(['P1', 'P2']);
    });
});

describe('detectTruncatedTranslation', () => {
    describe('returns undefined (no issue) for valid translations', () => {
        it('should work when translation length is proportional to Arabic', () => {
            // Arabic: 100 chars, English: 150 chars - reasonable ratio
            const arabic =
                'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي الذي يحتاج إلى ترجمة';
            const english =
                'This is a long Arabic text that contains sufficient content for translation and it represents a full paragraph of Arabic text that needs to be translated.';
            expect(detectTruncatedTranslation(arabic, english)).toBeUndefined();
        });

        it('should work when both texts are short', () => {
            // Very short texts shouldn't trigger false positives
            const arabic = 'نعم';
            const english = 'Yes';
            expect(detectTruncatedTranslation(arabic, english)).toBeUndefined();
        });

        it('should work when Arabic is empty', () => {
            expect(detectTruncatedTranslation('', 'Some translation')).toBeUndefined();
        });

        it('should work when translation is empty but Arabic is also very short', () => {
            // Edge case - single word Arabic with no translation might be intentional
            expect(detectTruncatedTranslation('كلمة', '')).toBeUndefined();
        });

        it('should work when translation is reasonable for medium Arabic text', () => {
            const arabic = 'قال الشيخ: هذا الحكم صحيح ولا إشكال فيه'; // ~40 chars
            const english = 'The Shaykh said: This ruling is correct and there is no issue with it'; // ~70 chars
            expect(detectTruncatedTranslation(arabic, english)).toBeUndefined();
        });
    });

    describe('detects truncated translations', () => {
        it('should trigger when long Arabic has only a single line translation', () => {
            // A common LLM error: translating only the first line
            const arabic = `قال الشيخ: هذا الحكم صحيح ولا إشكال فيه لأن النبي صلى الله عليه وسلم قال في الحديث الصحيح عن أبي هريرة رضي الله عنه أنه قال سمعت رسول الله صلى الله عليه وسلم يقول كذا وكذا وهذا يدل على صحة ما ذكرناه من الحكم الشرعي في هذه المسألة`;
            const english = 'The Shaykh said:'; // Only translated the first few words
            const error = detectTruncatedTranslation(arabic, english);
            expect(error).toBeDefined();
            expect(error).toContain('truncated');
        });

        it('should trigger when translation is suspiciously short for paragraph-length Arabic', () => {
            // Arabic paragraph (~200 chars) with tiny translation
            const arabic =
                'السائل: يا شيخنا هذا سؤال مهم جداً في مسألة البيع والشراء وحكم الربا في المعاملات المالية المعاصرة وما يتعلق بها من الأحكام الشرعية التي يحتاج المسلم إلى معرفتها في حياته اليومية';
            const english = 'Question about sales.'; // Way too short
            const error = detectTruncatedTranslation(arabic, english);
            expect(error).toBeDefined();
        });

        it('should trigger when translation is empty but Arabic is long', () => {
            const arabic =
                'هذا نص عربي طويل جداً يحتوي على فقرة كاملة من الكلام العربي الذي يحتاج إلى ترجمة وافية ولكن الترجمة فارغة تماماً';
            const english = '';
            const error = detectTruncatedTranslation(arabic, english);
            expect(error).toBeDefined();
            expect(error).toContain('empty');
        });

        it('should trigger when translation is only whitespace but Arabic is long', () => {
            const arabic = 'هذا نص عربي طويل جداً يحتوي على فقرة كاملة من الكلام العربي الذي يحتاج إلى ترجمة';
            const english = '   \n\t  ';
            const error = detectTruncatedTranslation(arabic, english);
            expect(error).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle undefined/null-like inputs gracefully', () => {
            expect(detectTruncatedTranslation('', '')).toBeUndefined();
        });

        it('should not flag when Arabic is moderately longer due to script differences', () => {
            // Arabic script can be more compact; allow for natural variance
            const arabic = 'بسم الله الرحمن الرحيم والحمد لله رب العالمين'; // ~45 chars
            const english =
                'In the name of Allah, the Most Gracious, the Most Merciful, and praise be to Allah, Lord of the worlds'; // ~100 chars
            expect(detectTruncatedTranslation(arabic, english)).toBeUndefined();
        });

        it('should use character count, not word count', () => {
            // Arabic words are often longer due to prefixes/suffixes
            const arabic = 'فسيكفيكهم الله'; // Single long word
            const english = 'Allah will suffice you against them'; // Multiple words but reasonable
            expect(detectTruncatedTranslation(arabic, english)).toBeUndefined();
        });
    });
});

// Import and test findExcerptIssues
import { findExcerptIssues } from './validation';

describe('findExcerptIssues', () => {
    describe('gap detection', () => {
        it('should find a single gap in the middle', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' }, // Gap
                { id: 'P3', nass: 'عربي', text: 'Translation' },
            ];
            expect(findExcerptIssues(items)).toEqual(['P2']);
        });

        it('should find multiple gaps', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' }, // Gap
                { id: 'P3', nass: 'عربي', text: 'Translation' },
                { id: 'P4', nass: 'عربي', text: null }, // Gap
                { id: 'P5', nass: 'عربي', text: 'Translation' },
            ];
            const issues = findExcerptIssues(items);
            expect(issues).toContain('P2');
            expect(issues).toContain('P4');
        });

        it('should not flag first or last item even if missing translation', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: '' }, // First - not a gap
                { id: 'P2', nass: 'عربي', text: 'Translation' },
                { id: 'P3', nass: 'عربي', text: '' }, // Last - not a gap
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });

        it('should flag 2 consecutive missing translations as gaps', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' }, // Gap
                { id: 'P3', nass: 'عربي', text: '' }, // Gap
                { id: 'P4', nass: 'عربي', text: 'Translation' },
            ];
            const issues = findExcerptIssues(items);
            expect(issues).toContain('P2');
            expect(issues).toContain('P3');
            expect(issues.length).toBe(2);
        });

        it('should flag 3 consecutive missing translations as gaps', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' }, // Gap
                { id: 'P3', nass: 'عربي', text: '' }, // Gap
                { id: 'P4', nass: 'عربي', text: '' }, // Gap
                { id: 'P5', nass: 'عربي', text: 'Translation' },
            ];
            const issues = findExcerptIssues(items);
            expect(issues).toContain('P2');
            expect(issues).toContain('P3');
            expect(issues).toContain('P4');
            expect(issues.length).toBe(3);
        });

        it('should NOT flag more than 3 consecutive missing translations (likely untranslated section)', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' }, // Not flagged - too many consecutive
                { id: 'P3', nass: 'عربي', text: '' },
                { id: 'P4', nass: 'عربي', text: '' },
                { id: 'P5', nass: 'عربي', text: '' },
                { id: 'P6', nass: 'عربي', text: 'Translation' },
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });

        it('should only flag gaps surrounded by translations on both sides', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: '' }, // Not a gap - no prev translation
                { id: 'P2', nass: 'عربي', text: '' },
                { id: 'P3', nass: 'عربي', text: 'Translation' },
                { id: 'P4', nass: 'عربي', text: '' }, // Gap - surrounded by translations
                { id: 'P5', nass: 'عربي', text: 'Translation' },
                { id: 'P6', nass: 'عربي', text: '' }, // Not a gap - no next translation
            ];
            expect(findExcerptIssues(items)).toEqual(['P4']);
        });
    });

    describe('truncation detection', () => {
        it('should find truncated translation', () => {
            const longArabic = 'هذا نص عربي طويل جداً يحتوي على فقرة كاملة من الكلام العربي الذي يحتاج إلى ترجمة وافية';
            const items = [
                { id: 'P1', nass: longArabic, text: 'Short' }, // Truncated
            ];
            expect(findExcerptIssues(items)).toEqual(['P1']);
        });

        it('should not flag properly translated items', () => {
            const items = [
                { id: 'P1', nass: 'نص قصير', text: 'Short text' },
                { id: 'P2', nass: 'قال الشيخ: هذا الحكم صحيح', text: 'The Shaykh said: This ruling is correct' },
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });
    });

    describe('combined detection', () => {
        it('should find both gaps and truncated translations', () => {
            const longArabic = 'هذا نص عربي طويل جداً يحتوي على فقرة كاملة من الكلام العربي الذي يحتاج إلى ترجمة وافية';
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' }, // Gap
                { id: 'P3', nass: 'عربي', text: 'Translation' },
                { id: 'P4', nass: longArabic, text: 'Too short' }, // Truncated
            ];
            const issues = findExcerptIssues(items);
            expect(issues).toContain('P2');
            expect(issues).toContain('P4');
            expect(issues.length).toBe(2);
        });

        it('should deduplicate if same item is both gap and truncated', () => {
            const longArabic = 'هذا نص عربي طويل جداً يحتوي على فقرة كاملة من الكلام العربي الذي يحتاج إلى ترجمة وافية';
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: longArabic, text: '' }, // Gap AND empty translation
                { id: 'P3', nass: 'عربي', text: 'Translation' },
            ];
            const issues = findExcerptIssues(items);
            expect(issues).toEqual(['P2']); // Only once
        });
    });

    describe('edge cases', () => {
        it('should return empty array for empty input', () => {
            expect(findExcerptIssues([])).toEqual([]);
        });

        it('should return empty array for single item', () => {
            expect(findExcerptIssues([{ id: 'P1', nass: 'عربي', text: '' }])).toEqual([]);
        });

        it('should return empty array for two items', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' },
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });

        it('should handle null and undefined text values', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: null },
                { id: 'P3', nass: 'عربي', text: 'Translation' },
            ];
            expect(findExcerptIssues(items)).toEqual(['P2']);
        });

        it('should handle undefined text values in gaps', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي' }, // text is undefined
                { id: 'P3', nass: 'عربي', text: 'Translation' },
            ];
            expect(findExcerptIssues(items)).toEqual(['P2']);
        });

        it('should handle whitespace-only text as missing translation', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '   \t\n  ' }, // Whitespace only
                { id: 'P3', nass: 'عربي', text: 'Translation' },
            ];
            expect(findExcerptIssues(items)).toEqual(['P2']);
        });

        it('should handle all items having translations (no gaps)', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation 1' },
                { id: 'P2', nass: 'عربي', text: 'Translation 2' },
                { id: 'P3', nass: 'عربي', text: 'Translation 3' },
                { id: 'P4', nass: 'عربي', text: 'Translation 4' },
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });

        it('should handle all items missing translations (no gaps to detect)', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: '' },
                { id: 'P2', nass: 'عربي', text: '' },
                { id: 'P3', nass: 'عربي', text: '' },
                { id: 'P4', nass: 'عربي', text: '' },
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });

        it('should handle alternating translated/untranslated pattern', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' }, // Gap
                { id: 'P3', nass: 'عربي', text: 'Translation' },
                { id: 'P4', nass: 'عربي', text: '' }, // Gap
                { id: 'P5', nass: 'عربي', text: 'Translation' },
            ];
            const issues = findExcerptIssues(items);
            expect(issues).toContain('P2');
            expect(issues).toContain('P4');
            expect(issues.length).toBe(2);
        });

        it('should handle exactly 4 consecutive gaps (not flagged)', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' },
                { id: 'P3', nass: 'عربي', text: '' },
                { id: 'P4', nass: 'عربي', text: '' },
                { id: 'P5', nass: 'عربي', text: '' },
                { id: 'P6', nass: 'عربي', text: 'Translation' },
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });

        it('should handle multiple separate gap regions', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' }, // Gap region 1 (1 item)
                { id: 'P3', nass: 'عربي', text: 'Translation' },
                { id: 'P4', nass: 'عربي', text: '' }, // Gap region 2 (2 items)
                { id: 'P5', nass: 'عربي', text: '' },
                { id: 'P6', nass: 'عربي', text: 'Translation' },
                { id: 'P7', nass: 'عربي', text: '' }, // Gap region 3 (3 items)
                { id: 'P8', nass: 'عربي', text: '' },
                { id: 'P9', nass: 'عربي', text: '' },
                { id: 'P10', nass: 'عربي', text: 'Translation' },
            ];
            const issues = findExcerptIssues(items);
            expect(issues).toContain('P2');
            expect(issues).toContain('P4');
            expect(issues).toContain('P5');
            expect(issues).toContain('P7');
            expect(issues).toContain('P8');
            expect(issues).toContain('P9');
            expect(issues.length).toBe(6);
        });

        it('should handle mixed gap sizes (some flagged, some not)', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' }, // Gap (1 item) - flagged
                { id: 'P3', nass: 'عربي', text: 'Translation' },
                { id: 'P4', nass: 'عربي', text: '' }, // Gap (4 items) - NOT flagged
                { id: 'P5', nass: 'عربي', text: '' },
                { id: 'P6', nass: 'عربي', text: '' },
                { id: 'P7', nass: 'عربي', text: '' },
                { id: 'P8', nass: 'عربي', text: 'Translation' },
            ];
            const issues = findExcerptIssues(items);
            expect(issues).toEqual(['P2']);
        });

        it('should not flag items with empty text for truncation', () => {
            const longArabic = 'هذا نص عربي طويل جداً يحتوي على فقرة كاملة من الكلام العربي الذي يحتاج إلى ترجمة وافية';
            const items = [
                { id: 'P1', nass: longArabic, text: '' }, // Empty - not checked for truncation
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });

        it('should flag item with truncated text (not empty)', () => {
            const longArabic = 'هذا نص عربي طويل جداً يحتوي على فقرة كاملة من الكلام العربي الذي يحتاج إلى ترجمة وافية';
            const items = [
                { id: 'P1', nass: longArabic, text: 'X' }, // Has text, but truncated
            ];
            expect(findExcerptIssues(items)).toEqual(['P1']);
        });

        it('should handle gap at boundary of flaggable size (exactly 3)', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' },
                { id: 'P3', nass: 'عربي', text: '' },
                { id: 'P4', nass: 'عربي', text: '' },
                { id: 'P5', nass: 'عربي', text: 'Translation' },
            ];
            const issues = findExcerptIssues(items);
            expect(issues.length).toBe(3);
            expect(issues).toContain('P2');
            expect(issues).toContain('P3');
            expect(issues).toContain('P4');
        });

        it('should handle gap starting at first position (no prev translation)', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: '' }, // No gap - no prev translation
                { id: 'P2', nass: 'عربي', text: '' },
                { id: 'P3', nass: 'عربي', text: 'Translation' },
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });

        it('should handle gap ending at last position (no next translation)', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' }, // No gap - no next translation
                { id: 'P3', nass: 'عربي', text: '' },
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });

        it('should handle single translated item between untranslated sections', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: '' },
                { id: 'P2', nass: 'عربي', text: '' },
                { id: 'P3', nass: 'عربي', text: 'Translation' }, // Single translated
                { id: 'P4', nass: 'عربي', text: '' },
                { id: 'P5', nass: 'عربي', text: '' },
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });
    });
});
