import { describe, expect, it } from 'bun:test';
import type { Page } from 'flappa-doormal';
import { applyReplacements } from './replace.js';

describe('Replacements', () => {
    it('should apply simple string replacements', () => {
        const pages: Page[] = [{ content: 'Hello World', id: 1 }];
        const replacements = [{ regex: 'World', replacement: 'Universe' }];
        const result = applyReplacements(pages, replacements);
        expect(result[0].content).toBe('Hello Universe');
    });

    it('should apply multiple replacements', () => {
        const pages: Page[] = [{ content: 'Hello World', id: 1 }];
        const replacements = [
            { regex: 'Hello', replacement: 'Hi' },
            { regex: 'World', replacement: 'Universe' },
        ];
        const result = applyReplacements(pages, replacements);
        expect(result[0].content).toBe('Hi Universe');
    });

    it('should apply replacements across all pages by default', () => {
        const pages: Page[] = [
            { content: 'Marker here', id: 1 },
            { content: 'Another marker', id: 2 },
        ];
        const replacements = [{ regex: 'marker', replacement: 'found' }];
        const result = applyReplacements(pages, replacements);
        expect(result[0].content).toBe('Marker here'); // Case sensitive default
        expect(result[1].content).toBe('Another found');
    });

    it('should respect case-insensitive flag', () => {
        const pages: Page[] = [{ content: 'Marker marker', id: 1 }];
        const replacements = [{ flags: 'gi', regex: 'marker', replacement: 'found' }];
        const result = applyReplacements(pages, replacements);
        expect(result[0].content).toBe('found found');
    });

    it('should allow non-global replacements with empty flags', () => {
        const pages: Page[] = [{ content: 'Marker marker', id: 1 }];
        const replacements = [{ flags: '', regex: 'marker', replacement: 'found' }];
        const result = applyReplacements(pages, replacements);
        expect(result[0].content).toBe('Marker found'); // only first match
    });

    it('should filter by pages string', () => {
        const pages: Page[] = [
            { content: 'Replace me', id: 1 },
            { content: 'Replace me', id: 2 },
        ];
        const replacements = [{ pages: '1', regex: 'Replace me', replacement: 'Done' }];
        const result = applyReplacements(pages, replacements);
        expect(result[0].content).toBe('Done');
        expect(result[1].content).toBe('Replace me');
    });

    it('should handle ranges and multiple segments in string', () => {
        const pages: Page[] = [
            { content: 'Replace me', id: 1 },
            { content: 'Replace me', id: 2 },
            { content: 'Replace me', id: 3 },
            { content: 'Replace me', id: 4 },
        ];
        // "1-2, 4" -> 1, 2, 4. So 3 is skipped.
        const replacements = [{ pages: '1-2, 4', regex: 'Replace me', replacement: 'Done' }];
        const result = applyReplacements(pages, replacements);
        expect(result[0].content).toBe('Done');
        expect(result[1].content).toBe('Done');
        expect(result[2].content).toBe('Replace me');
        expect(result[3].content).toBe('Done');
    });

    it('should handle open ranges (1+)', () => {
        const pages: Page[] = [
            { content: 'Replace me', id: 1 },
            { content: 'Replace me', id: 2 },
            { content: 'Replace me', id: 3 },
        ];
        const replacements = [{ pages: '2+', regex: 'Replace me', replacement: 'Done' }];
        const result = applyReplacements(pages, replacements);
        expect(result[0].content).toBe('Replace me');
        expect(result[1].content).toBe('Done');
        expect(result[2].content).toBe('Done');
    });

    it('should handle empty pages string (skip rule)', () => {
        const pages: Page[] = [{ content: 'Replace me', id: 1 }];
        const replacements = [{ pages: '', regex: 'Replace me', replacement: 'Done' }];
        const result = applyReplacements(pages, replacements);
        expect(result[0].content).toBe('Replace me');
    });

    it('should handle mixed static and open ranges', () => {
        const pages: Page[] = [
            { content: 'Replace me', id: 1 },
            { content: 'Replace me', id: 2 },
            { content: 'Replace me', id: 3 },
            { content: 'Replace me', id: 4 },
            { content: 'Replace me', id: 5 },
        ];
        const replacements = [{ pages: '1, 4+', regex: 'Replace me', replacement: 'Done' }];
        const result = applyReplacements(pages, replacements);
        expect(result[0].content).toBe('Done');
        expect(result[1].content).toBe('Replace me');
        expect(result[2].content).toBe('Replace me');
        expect(result[3].content).toBe('Done');
        expect(result[4].content).toBe('Done');
    });
});
