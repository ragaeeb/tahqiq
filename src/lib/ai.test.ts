import { describe, expect, it } from 'bun:test';

import { generateTranslationText } from './ai';

describe('ai', () => {
    describe('generateTranslationText', () => {
        it('should return empty array for empty pages', () => {
            const result = generateTranslationText([], { maxTokens: 1000 });
            expect(result).toEqual([]);
        });

        it('should process single page with text ending in punctuation', () => {
            const pages = [{ page: 1, text: 'هذا نص عربي.' } as any];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual(['P1\nهذا نص عربي.']);
        });

        it('should process single page with Arabic punctuation marks', () => {
            const pages = [{ page: 1, text: 'هذا سؤال؟' } as any];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual(['P1\nهذا سؤال؟']);
        });

        it('should concatenate pages when text does not end with punctuation', () => {
            const pages = [{ page: 1, text: 'هذا نص' } as any, { page: 2, text: 'مكمل للنص الأول.' } as any];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual(['P1_2\nهذا نص مكمل للنص الأول.']);
        });

        it('should handle mixed punctuation scenarios', () => {
            const pages = [
                { page: 1, text: 'نص مكتمل.' } as any,
                { page: 2, text: 'نص غير مكتمل' } as any,
                { page: 3, text: 'مكمل للثاني!' } as any,
            ];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual(['P1\nنص مكتمل.\n\nP2_3\nنص غير مكتمل مكمل للثاني!']);
        });

        it('should process footnotes correctly', () => {
            const pages = [
                { footnotes: 'حاشية الصفحة الأولى.', page: 1, text: 'النص الرئيسي.' } as any,
                { footnotes: 'حاشية أخرى.', page: 2, text: 'نص آخر.' } as any,
            ];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual(['P1\nالنص الرئيسي.\n\nP2\nنص آخر.\n\nF1\nحاشية الصفحة الأولى.\n\nF2\nحاشية أخرى.']);
        });

        it('should handle pages with empty footnotes', () => {
            const pages = [
                { footnotes: '', page: 1, text: 'النص الرئيسي.' } as any,
                { footnotes: 'حاشية صحيحة.', page: 2, text: 'نص آخر.' } as any,
            ];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual(['P1\nالنص الرئيسي.\n\nP2\nنص آخر.\n\nF2\nحاشية صحيحة.']);
        });

        it('should handle pages with whitespace-only footnotes', () => {
            const pages = [
                { footnotes: '   ', page: 1, text: 'النص الرئيسي.' } as any,
                { footnotes: 'حاشية صحيحة.', page: 2, text: 'نص آخر.' } as any,
            ];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual(['P1\nالنص الرئيسي.\n\nP2\nنص آخر.\n\nF1_2\n حاشية صحيحة.']);
        });

        it('should concatenate footnotes when they do not end with punctuation', () => {
            const pages = [
                { footnotes: 'حاشية غير مكتملة', page: 1, text: 'النص.' } as any,
                { footnotes: 'مكملة للحاشية الأولى.', page: 2, text: 'نص آخر.' } as any,
            ];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual(['P1\nالنص.\n\nP2\nنص آخر.\n\nF1_2\nحاشية غير مكتملة مكملة للحاشية الأولى.']);
        });

        it('should split content into multiple batches when exceeding token limit', () => {
            const longText = 'نص طويل جداً '.repeat(100); // Creates a long text
            const pages = [{ page: 1, text: longText + '.' } as any, { page: 2, text: longText + '.' } as any];

            const result = generateTranslationText(pages, { maxTokens: 10 }); // Very low token limit
            expect(result.length).toBeGreaterThan(1);
            expect(result[0]).toContain('P1');
            expect(result[1]).toContain('P2');
        });

        it('should handle all Arabic punctuation marks correctly', () => {
            const pages = [
                { page: 1, text: 'نص بالنقطة.' } as any,
                { page: 2, text: 'نص بعلامة التعجب!' } as any,
                { page: 3, text: 'نص بعلامة الاستفهام؟' } as any,
                { page: 4, text: 'نص بالفاصلة،' } as any,
                { page: 5, text: 'نص بالفاصلة المنقوطة؛' } as any,
            ];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual([
                'P1\nنص بالنقطة.\n\nP2\nنص بعلامة التعجب!\n\nP3\nنص بعلامة الاستفهام؟\n\nP4\nنص بالفاصلة،\n\nP5\nنص بالفاصلة المنقوطة؛',
            ]);
        });

        it('should handle text with trailing whitespace', () => {
            const pages = [
                { page: 1, text: 'نص مع مسافات.   ' } as any,
                { page: 2, text: '   نص آخر مع مسافات   ' } as any,
            ];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual(['P1\nنص مع مسافات.   \n\nP2\n   نص آخر مع مسافات   ']);
        });

        it('should handle empty text strings', () => {
            const pages = [{ page: 1, text: '' } as any, { page: 2, text: 'نص صحيح.' } as any];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual(['P1_2\n نص صحيح.']);
        });

        it('should handle complex scenario with mixed content', () => {
            const pages = [
                { footnotes: 'الحاشية الأولى.', page: 1, text: 'النص الأول.' } as any,
                { footnotes: 'حاشية غير مكتملة', page: 2, text: 'نص غير مكتمل' } as any,
                { footnotes: 'مكملة للحاشية؟', page: 3, text: 'مكمل للنص!' } as any,
                { footnotes: '', page: 4, text: 'نص منفصل.' } as any,
            ];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual([
                'P1\nالنص الأول.\n\nP2_3\nنص غير مكتمل مكمل للنص!\n\nP4\nنص منفصل.\n\nF1\nالحاشية الأولى.\n\nF2_3\nحاشية غير مكتملة مكملة للحاشية؟',
            ]);
        });

        it('should handle pages with undefined footnotes', () => {
            const pages = [
                { page: 1, text: 'النص الرئيسي.' } as any,
                { footnotes: 'حاشية.', page: 2, text: 'نص آخر.' } as any,
            ];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual(['P1\nالنص الرئيسي.\n\nP2\nنص آخر.\n\nF2\nحاشية.']);
        });

        it('should handle single character punctuation edge case', () => {
            const pages = [{ page: 1, text: '.' } as any, { page: 2, text: '؟' } as any];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual(['P1\n.\n\nP2\n؟']);
        });

        it('should handle very strict token limits forcing single segments per batch', () => {
            const pages = [{ page: 1, text: 'نص قصير.' } as any, { page: 2, text: 'نص آخر.' } as any];

            const result = generateTranslationText(pages, { maxTokens: 5 });
            expect(result.length).toBe(2);
            expect(result[0]).toContain('P1');
            expect(result[1]).toContain('P2');
        });

        it('should handle pages that span multiple pages until the very last page', () => {
            const pages = [
                { page: 1, text: 'بداية' } as any,
                { page: 2, text: 'وسط' } as any,
                { page: 3, text: 'نهاية.' } as any,
            ];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual(['P1_3\nبداية وسط نهاية.']);
        });

        it('should handle concatenation ending at last page without punctuation', () => {
            const pages = [{ page: 1, text: 'نص مكتمل.' } as any, { page: 2, text: 'نص غير مكتمل' } as any];

            const result = generateTranslationText(pages, { maxTokens: 1000 });
            expect(result).toEqual(['P1\nنص مكتمل.\n\nP2\nنص غير مكتمل']);
        });
    });
});
