import { describe, expect, it } from 'bun:test';
import { pageNumberToColor, pageNumberToHoverColor } from './colorUtils';

describe('pageNumberToColor', () => {
    it('should return valid HSL color string', () => {
        const color = pageNumberToColor(1);
        expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    });

    it('should return same color for same page number', () => {
        const color1 = pageNumberToColor(42);
        const color2 = pageNumberToColor(42);
        expect(color1).toBe(color2);
    });

    it('should return different colors for sequential page numbers', () => {
        const colors = new Set<string>();
        // Generate colors for pages 1-20
        for (let i = 1; i <= 20; i++) {
            colors.add(pageNumberToColor(i));
        }
        // All should be unique (golden ratio ensures good distribution)
        expect(colors.size).toBe(20);
    });

    it('should have high lightness for black text readability', () => {
        const color = pageNumberToColor(5);
        // Extract lightness from HSL string
        const match = color.match(/hsl\(\d+, \d+%, (\d+)%\)/);
        const lightness = match ? parseInt(match[1], 10) : 0;
        // Lightness should be >= 80% for good black text contrast
        expect(lightness).toBeGreaterThanOrEqual(80);
    });

    it('should produce visually distinct hues for consecutive pages', () => {
        // Extract hues for pages 1-5
        const hues: number[] = [];
        for (let i = 1; i <= 5; i++) {
            const color = pageNumberToColor(i);
            const match = color.match(/hsl\((\d+),/);
            if (match) {
                hues.push(parseInt(match[1], 10));
            }
        }

        // Check that consecutive hues are well separated (at least 30 degrees apart)
        for (let i = 1; i < hues.length; i++) {
            const diff = Math.abs(hues[i] - hues[i - 1]);
            // Account for wrapping around 360
            const minDiff = Math.min(diff, 360 - diff);
            expect(minDiff).toBeGreaterThanOrEqual(30);
        }
    });
});

describe('pageNumberToHoverColor', () => {
    it('should return valid HSL color string', () => {
        const color = pageNumberToHoverColor(1);
        expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    });

    it('should have same hue as base color', () => {
        const baseColor = pageNumberToColor(10);
        const hoverColor = pageNumberToHoverColor(10);

        const baseHue = baseColor.match(/hsl\((\d+),/)?.[1];
        const hoverHue = hoverColor.match(/hsl\((\d+),/)?.[1];

        expect(baseHue).toBe(hoverHue);
    });

    it('should have lower lightness than base color', () => {
        const baseColor = pageNumberToColor(10);
        const hoverColor = pageNumberToHoverColor(10);

        const baseLightness = parseInt(baseColor.match(/(\d+)%\)$/)?.[1] || '0', 10);
        const hoverLightness = parseInt(hoverColor.match(/(\d+)%\)$/)?.[1] || '0', 10);

        expect(hoverLightness).toBeLessThan(baseLightness);
    });
});
