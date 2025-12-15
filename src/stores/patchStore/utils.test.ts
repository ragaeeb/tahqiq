import { describe, expect, it } from 'bun:test';
import { applyPatch, canApplyPatch, createPatch } from './utils';

describe('patchStore/utils', () => {
    describe('createPatch', () => {
        it('should return null when texts are identical', () => {
            const text = 'Hello World';
            expect(createPatch(text, text)).toBeNull();
        });

        it('should create a patch for a simple character addition', () => {
            const old = 'Hello World';
            const updated = 'Hello, World';
            const patch = createPatch(old, updated);

            expect(patch).not.toBeNull();
            expect(patch).toContain(',');
        });

        it('should create a patch for character removal', () => {
            const old = 'Hello, World';
            const updated = 'Hello World';
            const patch = createPatch(old, updated);

            expect(patch).not.toBeNull();
        });

        it('should create a patch for line break changes', () => {
            const old = 'Line one\nLine two';
            const updated = 'Line one\n\nLine two';
            const patch = createPatch(old, updated);

            expect(patch).not.toBeNull();
        });
    });

    describe('applyPatch', () => {
        it('should apply a patch successfully', () => {
            const old = 'Hello World';
            const updated = 'Hello, World';
            const patch = createPatch(old, updated)!;

            const { result, success } = applyPatch(patch, old);

            expect(result).toBe(updated);
            expect(success.every(Boolean)).toBe(true);
        });

        it('should handle Arabic text correctly', () => {
            const old = 'بسم الله الرحمن الرحيم';
            const updated = 'بسم الله الرّحمن الرحيم';
            const patch = createPatch(old, updated)!;

            const { result, success } = applyPatch(patch, old);

            expect(result).toBe(updated);
            expect(success.every(Boolean)).toBe(true);
        });
    });

    describe('canApplyPatch', () => {
        it('should return true for valid patches', () => {
            const old = 'Hello World';
            const updated = 'Hello, World';
            const patch = createPatch(old, updated)!;

            expect(canApplyPatch(patch, old)).toBe(true);
        });

        it('should return true even when text has shifted slightly', () => {
            // diff-match-patch uses fuzzy matching
            const old = 'The quick brown fox jumps over the lazy dog';
            const updated = 'The quick brown cat jumps over the lazy dog';
            const patch = createPatch(old, updated)!;

            // Apply to slightly different text
            const shifted = 'A The quick brown fox jumps over the lazy dog';
            expect(canApplyPatch(patch, shifted)).toBe(true);
        });
    });
});
