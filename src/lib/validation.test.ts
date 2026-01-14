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
