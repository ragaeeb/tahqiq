import { describe, expect, it } from 'bun:test';

// Replicate the countMatches function from ReplacementsTab.tsx for testing
// Since convertContentToMarkdown is from 'shamela' library, we'll test the regex logic directly
const countMatches = (pattern: string, contents: string[]): number => {
    if (!pattern.trim()) {
        return 0;
    }

    try {
        const regex = new RegExp(pattern, 'gu');
        let total = 0;

        for (const content of contents) {
            const matches = content.match(regex);
            if (matches) {
                total += matches.length;
            }
        }

        return total;
    } catch {
        return -1; // Invalid regex
    }
};

describe('ReplacementsTab', () => {
    describe('countMatches', () => {
        it('should return 0 for empty pattern', () => {
            const result = countMatches('', ['some content']);

            expect(result).toBe(0);
        });

        it('should return 0 for whitespace-only pattern', () => {
            const result = countMatches('   ', ['some content']);

            expect(result).toBe(0);
        });

        it('should count matches across multiple pages', () => {
            const contents = ['hello world hello', 'hello again', 'no match here'];

            const result = countMatches('hello', contents);

            expect(result).toBe(3);
        });

        it('should return 0 when no matches found', () => {
            const result = countMatches('xyz', ['abc def ghi']);

            expect(result).toBe(0);
        });

        it('should return -1 for invalid regex', () => {
            const result = countMatches('[invalid(regex', ['content']);

            expect(result).toBe(-1);
        });

        it('should handle Unicode patterns correctly', () => {
            const contents = ['بسم الله الرحمن', 'الله أكبر', 'test'];

            const result = countMatches('الله', contents);

            expect(result).toBe(2);
        });

        it('should handle regex special characters', () => {
            const contents = ['test.value', 'another.value', 'no match'];

            const result = countMatches('\\.', contents);

            expect(result).toBe(2);
        });

        it('should match globally (all occurrences)', () => {
            const contents = ['aaa'];

            const result = countMatches('a', contents);

            expect(result).toBe(3);
        });
    });
});
