import { describe, expect, test } from 'bun:test';
import {
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
        test('returns undefined for valid markers', () => {
            const text = `P11622a - Some translation
C123 - Another translation
B45b - Third one`;
            expect(validateTranslationMarkers(text)).toBeUndefined();
        });

        test('detects invalid reference format with characters in middle', () => {
            const text = 'B12a34 - Invalid format';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('Invalid reference format');
            expect(error).toContain('B12a34');
        });

        test('detects dollar sign in reference', () => {
            const text = 'B1234$5 - Invalid with dollar';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('$');
        });

        test('detects empty content after dash', () => {
            const text = 'P123 -';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('no content after it');
        });

        test('detects empty content after dash with whitespace', () => {
            const text = 'P123 -   ';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('no content after it');
        });

        test('allows valid suffixes a-j', () => {
            const text = `P123a - Valid
P456b - Also valid
P789j - Still valid`;
            expect(validateTranslationMarkers(text)).toBeUndefined();
        });

        test('detects multi-letter suffix with space before', () => {
            const text = 'Some text P123ab - Translation';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('Suspicious reference');
        });
    });

    describe('normalizeTranslationText', () => {
        test('splits merged markers onto separate lines', () => {
            const input = 'P123 - First translation P456 - Second translation';
            const result = normalizeTranslationText(input);
            expect(result).toContain('\nP456 -');
        });

        test('handles multiple merged markers', () => {
            const input = 'P1 - First P2 - Second P3 - Third';
            const result = normalizeTranslationText(input);
            const lines = result.split('\n');
            expect(lines.length).toBe(3);
        });

        test('preserves already-separated markers', () => {
            const input = `P123 - First
P456 - Second`;
            const result = normalizeTranslationText(input);
            expect(result).toBe(input);
        });

        test('replaces escaped brackets', () => {
            const input = 'P123 - Text with \\[brackets\\]';
            const result = normalizeTranslationText(input);
            expect(result).toContain('[brackets');
        });

        test('handles en dash and em dash', () => {
            const input = 'P1 – First P2 — Second';
            const result = normalizeTranslationText(input);
            expect(result.split('\n').length).toBe(2);
        });

        test('splits markers with no space before them (period directly before marker)', () => {
            const input = 'P6821 - Questioner: This is the answer.P6822 - Next question';
            const result = normalizeTranslationText(input);
            expect(result).toContain('\nP6822 -');
            expect(result.split('\n').length).toBe(2);
        });

        test('handles complex mid-sentence markers', () => {
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

        test('normalizes Windows-style CRLF line endings to LF', () => {
            const input = 'P1 - First\r\nP2 - Second\r\nP3 - Third';
            const result = normalizeTranslationText(input);
            expect(result).not.toContain('\r');
            expect(result).toContain('\n');
            const ids = extractTranslationIds(result);
            expect(ids).toEqual(['P1', 'P2', 'P3']);
        });

        test('normalizes old Mac-style CR line endings to LF', () => {
            const input = 'P1 - First\rP2 - Second\rP3 - Third';
            const result = normalizeTranslationText(input);
            expect(result).not.toContain('\r');
            const ids = extractTranslationIds(result);
            expect(ids).toEqual(['P1', 'P2', 'P3']);
        });

        test('handles mixed line endings (CRLF and markers without spacing)', () => {
            const input = 'P6821 - Answer to question.P6822 - Next question\r\nThe Shaykh: response.P6823 - Another';
            const result = normalizeTranslationText(input);
            expect(result).not.toContain('\r');
            const ids = extractTranslationIds(result);
            expect(ids).toEqual(['P6821', 'P6822', 'P6823']);
        });
    });

    describe('extractTranslationIds', () => {
        test('extracts IDs in order', () => {
            const text = `P11622a - First
C11623 - Second
B100 - Third`;
            const ids = extractTranslationIds(text);
            expect(ids).toEqual(['P11622a', 'C11623', 'B100']);
        });

        test('handles mixed prefixes', () => {
            const text = `F1 - Footnote
T2 - Title
N3 - Note`;
            const ids = extractTranslationIds(text);
            expect(ids).toEqual(['F1', 'T2', 'N3']);
        });

        test('returns empty array for no markers', () => {
            const text = 'Just some random text without markers';
            const ids = extractTranslationIds(text);
            expect(ids).toEqual([]);
        });

        test('handles suffixes correctly', () => {
            const text = `P1a - With suffix
P2 - Without suffix
P3c - Another suffix`;
            const ids = extractTranslationIds(text);
            expect(ids).toEqual(['P1a', 'P2', 'P3c']);
        });
    });

    describe('extractIdNumber', () => {
        test('extracts number from simple ID', () => {
            expect(extractIdNumber('P123')).toBe(123);
        });

        test('extracts number from ID with suffix', () => {
            expect(extractIdNumber('P11622a')).toBe(11622);
        });

        test('extracts number from various prefixes', () => {
            expect(extractIdNumber('C456')).toBe(456);
            expect(extractIdNumber('B789')).toBe(789);
            expect(extractIdNumber('F100b')).toBe(100);
        });

        test('returns 0 for invalid ID', () => {
            expect(extractIdNumber('Invalid')).toBe(0);
        });
    });

    describe('extractIdPrefix', () => {
        test('extracts prefix from various IDs', () => {
            expect(extractIdPrefix('P123')).toBe('P');
            expect(extractIdPrefix('C456a')).toBe('C');
            expect(extractIdPrefix('B789')).toBe('B');
            expect(extractIdPrefix('F100b')).toBe('F');
        });
    });

    describe('validateNumericOrder', () => {
        test('returns undefined for correct numeric order', () => {
            const ids = ['P1', 'P2', 'P3'];
            expect(validateNumericOrder(ids)).toBeUndefined();
        });

        test('returns undefined for single ID', () => {
            expect(validateNumericOrder(['P1'])).toBeUndefined();
        });

        test('returns undefined for empty list', () => {
            expect(validateNumericOrder([])).toBeUndefined();
        });

        test('detects out of numeric order - user reported case', () => {
            // This is the exact case the user reported: P12659 before P12651
            const ids = ['P12659', 'P12651'];
            const error = validateNumericOrder(ids);
            expect(error).toContain('P12651');
            expect(error).toContain('12651');
            expect(error).toContain('P12659');
            expect(error).toContain('12659');
        });

        test('detects descending order', () => {
            const ids = ['P100', 'P50', 'P25'];
            const error = validateNumericOrder(ids);
            expect(error).toContain('P50');
            expect(error).toContain('appears after');
        });

        test('allows different prefixes to have independent order', () => {
            // C500 can come after P100 even though 500 > 100 - different prefix
            const ids = ['P100', 'C500', 'P200'];
            expect(validateNumericOrder(ids)).toBeUndefined();
        });

        test('detects order issue within same prefix across mixed IDs', () => {
            // P200 comes after P100, but P50 after P200 is wrong
            const ids = ['P100', 'C500', 'P200', 'C600', 'P50'];
            const error = validateNumericOrder(ids);
            expect(error).toContain('P50');
        });
    });

    describe('validateTranslationOrder', () => {
        // Store order: P1, P2, P6, P8, P10, P20
        const expectedIds = ['P1', 'P2', 'P6', 'P8', 'P10', 'P20'];

        test('returns undefined for correct order', () => {
            const translationIds = ['P1', 'P2', 'P6'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        test('returns undefined for empty expected list (no store data)', () => {
            const ids = ['P12659', 'P12651'];
            expect(validateTranslationOrder(ids, [])).toBeUndefined();
        });

        test('allows one reset (two blocks)', () => {
            // P6->P8->P10->P20 valid, then reset to P1->P2 valid
            const translationIds = ['P6', 'P8', 'P10', 'P20', 'P1', 'P2'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        test('allows multiple resets (three blocks)', () => {
            // P8->P10 valid, reset to P6->P20, reset to P1->P2
            const translationIds = ['P8', 'P10', 'P6', 'P20', 'P1', 'P2'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        test('allows many blocks out of global order', () => {
            // P10->P20 valid, reset to P1->P2, reset to P6->P8
            const translationIds = ['P10', 'P20', 'P1', 'P2', 'P6', 'P8'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        test('returns undefined for empty translation list', () => {
            expect(validateTranslationOrder([], expectedIds)).toBeUndefined();
        });

        test('handles IDs not in expected list gracefully', () => {
            const translationIds = ['P1', 'X999', 'P2'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        test('allows non-consecutive IDs that are in store order', () => {
            // P1, P6, P20 - skipping P2, P8, P10 is fine as long as order is maintained
            const translationIds = ['P1', 'P6', 'P20'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });
    });

    describe('validateTranslations', () => {
        const expectedIds = ['P1', 'P2', 'P3', 'P4', 'P5'];

        test('returns valid result for correct translations', () => {
            const text = `P1 - First translation
P2 - Second translation
P3 - Third translation`;
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
            expect(result.parsedIds).toEqual(['P1', 'P2', 'P3']);
        });

        test('normalizes merged markers before validation', () => {
            const text = 'P1 - First P2 - Second P3 - Third';
            const result = validateTranslations(text, expectedIds);
            expect(result.normalizedText).toContain('\n');
            expect(result.parsedIds).toEqual(['P1', 'P2', 'P3']);
        });

        test('returns error for invalid marker format', () => {
            const text = 'P1$2 - Invalid marker';
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('$');
        });

        test('returns error for no valid markers', () => {
            const text = 'Just some text without any markers';
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('No valid translation markers');
        });

        test('allows one reset in order - block pasting is valid', () => {
            // P4 then P1 is one reset, which is allowed
            const text = `P4 - Fourth
P5 - Fifth
P1 - First`;
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(true);
        });

        test('allows multiple resets - user case', () => {
            // Multiple blocks are now allowed
            const text = `P4 - Fourth
P2 - Second
P5 - Fifth
P1 - First`;
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(true);
        });

        test('handles complex multi-line translations', () => {
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

    test('returns empty array when all IDs match', () => {
        const translationIds = ['P1', 'P2', 'C10'];
        expect(findUnmatchedTranslationIds(translationIds, storeIds)).toEqual([]);
    });

    test('returns unmatched IDs', () => {
        const translationIds = ['P1', 'P99', 'C11', 'X999'];
        const unmatched = findUnmatchedTranslationIds(translationIds, storeIds);
        expect(unmatched).toEqual(['P99', 'X999']);
    });

    test('returns all IDs when none match', () => {
        const translationIds = ['Z1', 'Z2', 'Z3'];
        expect(findUnmatchedTranslationIds(translationIds, storeIds)).toEqual(['Z1', 'Z2', 'Z3']);
    });

    test('returns empty array for empty translation IDs', () => {
        expect(findUnmatchedTranslationIds([], storeIds)).toEqual([]);
    });

    test('returns all IDs when store is empty', () => {
        const translationIds = ['P1', 'P2'];
        expect(findUnmatchedTranslationIds(translationIds, [])).toEqual(['P1', 'P2']);
    });
});

// Import and test detectTruncatedTranslation
import { detectTruncatedTranslation } from './validation';

describe('detectTruncatedTranslation', () => {
    describe('returns undefined (no issue) for valid translations', () => {
        test('when translation length is proportional to Arabic', () => {
            // Arabic: 100 chars, English: 150 chars - reasonable ratio
            const arabic =
                'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي الذي يحتاج إلى ترجمة';
            const english =
                'This is a long Arabic text that contains sufficient content for translation and it represents a full paragraph of Arabic text that needs to be translated.';
            expect(detectTruncatedTranslation(arabic, english)).toBeUndefined();
        });

        test('when both texts are short', () => {
            // Very short texts shouldn't trigger false positives
            const arabic = 'نعم';
            const english = 'Yes';
            expect(detectTruncatedTranslation(arabic, english)).toBeUndefined();
        });

        test('when Arabic is empty', () => {
            expect(detectTruncatedTranslation('', 'Some translation')).toBeUndefined();
        });

        test('when translation is empty but Arabic is also very short', () => {
            // Edge case - single word Arabic with no translation might be intentional
            expect(detectTruncatedTranslation('كلمة', '')).toBeUndefined();
        });

        test('when translation is reasonable for medium Arabic text', () => {
            const arabic = 'قال الشيخ: هذا الحكم صحيح ولا إشكال فيه'; // ~40 chars
            const english = 'The Shaykh said: This ruling is correct and there is no issue with it'; // ~70 chars
            expect(detectTruncatedTranslation(arabic, english)).toBeUndefined();
        });
    });

    describe('detects truncated translations', () => {
        test('when long Arabic has only a single line translation', () => {
            // A common LLM error: translating only the first line
            const arabic = `قال الشيخ: هذا الحكم صحيح ولا إشكال فيه لأن النبي صلى الله عليه وسلم قال في الحديث الصحيح عن أبي هريرة رضي الله عنه أنه قال سمعت رسول الله صلى الله عليه وسلم يقول كذا وكذا وهذا يدل على صحة ما ذكرناه من الحكم الشرعي في هذه المسألة`;
            const english = 'The Shaykh said:'; // Only translated the first few words
            const error = detectTruncatedTranslation(arabic, english);
            expect(error).toBeDefined();
            expect(error).toContain('truncated');
        });

        test('when translation is suspiciously short for paragraph-length Arabic', () => {
            // Arabic paragraph (~200 chars) with tiny translation
            const arabic =
                'السائل: يا شيخنا هذا سؤال مهم جداً في مسألة البيع والشراء وحكم الربا في المعاملات المالية المعاصرة وما يتعلق بها من الأحكام الشرعية التي يحتاج المسلم إلى معرفتها في حياته اليومية';
            const english = 'Question about sales.'; // Way too short
            const error = detectTruncatedTranslation(arabic, english);
            expect(error).toBeDefined();
        });

        test('when translation is empty but Arabic is long', () => {
            const arabic =
                'هذا نص عربي طويل جداً يحتوي على فقرة كاملة من الكلام العربي الذي يحتاج إلى ترجمة وافية ولكن الترجمة فارغة تماماً';
            const english = '';
            const error = detectTruncatedTranslation(arabic, english);
            expect(error).toBeDefined();
            expect(error).toContain('empty');
        });

        test('when translation is only whitespace but Arabic is long', () => {
            const arabic = 'هذا نص عربي طويل جداً يحتوي على فقرة كاملة من الكلام العربي الذي يحتاج إلى ترجمة';
            const english = '   \n\t  ';
            const error = detectTruncatedTranslation(arabic, english);
            expect(error).toBeDefined();
        });
    });

    describe('edge cases', () => {
        test('handles undefined/null-like inputs gracefully', () => {
            expect(detectTruncatedTranslation('', '')).toBeUndefined();
        });

        test('does not flag when Arabic is moderately longer due to script differences', () => {
            // Arabic script can be more compact; allow for natural variance
            const arabic = 'بسم الله الرحمن الرحيم والحمد لله رب العالمين'; // ~45 chars
            const english =
                'In the name of Allah, the Most Gracious, the Most Merciful, and praise be to Allah, Lord of the worlds'; // ~100 chars
            expect(detectTruncatedTranslation(arabic, english)).toBeUndefined();
        });

        test('uses character count, not word count', () => {
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
        test('finds a single gap in the middle', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' }, // Gap
                { id: 'P3', nass: 'عربي', text: 'Translation' },
            ];
            expect(findExcerptIssues(items)).toEqual(['P2']);
        });

        test('finds multiple gaps', () => {
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

        test('does not flag first or last item even if missing translation', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: '' }, // First - not a gap
                { id: 'P2', nass: 'عربي', text: 'Translation' },
                { id: 'P3', nass: 'عربي', text: '' }, // Last - not a gap
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });

        test('does not flag consecutive missing translations as gaps', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' }, // Not a gap - next is also empty
                { id: 'P3', nass: 'عربي', text: '' }, // Not a gap - prev is also empty
                { id: 'P4', nass: 'عربي', text: 'Translation' },
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });
    });

    describe('truncation detection', () => {
        test('finds truncated translation', () => {
            const longArabic = 'هذا نص عربي طويل جداً يحتوي على فقرة كاملة من الكلام العربي الذي يحتاج إلى ترجمة وافية';
            const items = [
                { id: 'P1', nass: longArabic, text: 'Short' }, // Truncated
            ];
            expect(findExcerptIssues(items)).toEqual(['P1']);
        });

        test('does not flag properly translated items', () => {
            const items = [
                { id: 'P1', nass: 'نص قصير', text: 'Short text' },
                { id: 'P2', nass: 'قال الشيخ: هذا الحكم صحيح', text: 'The Shaykh said: This ruling is correct' },
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });
    });

    describe('combined detection', () => {
        test('finds both gaps and truncated translations', () => {
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

        test('deduplicates if same item is both gap and truncated', () => {
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
        test('returns empty array for empty input', () => {
            expect(findExcerptIssues([])).toEqual([]);
        });

        test('returns empty array for single item', () => {
            expect(findExcerptIssues([{ id: 'P1', nass: 'عربي', text: '' }])).toEqual([]);
        });

        test('returns empty array for two items', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: '' },
            ];
            expect(findExcerptIssues(items)).toEqual([]);
        });

        test('handles null and undefined text values', () => {
            const items = [
                { id: 'P1', nass: 'عربي', text: 'Translation' },
                { id: 'P2', nass: 'عربي', text: null },
                { id: 'P3', nass: 'عربي', text: 'Translation' },
            ];
            expect(findExcerptIssues(items)).toEqual(['P2']);
        });
    });
});
