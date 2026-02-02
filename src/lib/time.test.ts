import { describe, expect, it } from 'bun:test';

import { nowInSeconds, roundToDecimal } from './time';

describe('time', () => {
    describe('nowInSeconds', () => {
        it('should return current Unix timestamp in seconds', () => {
            const before = Math.floor(Date.now() / 1000);
            const result = nowInSeconds();
            const after = Math.floor(Date.now() / 1000);

            expect(result).toBeGreaterThanOrEqual(before);
            expect(result).toBeLessThanOrEqual(after);
        });

        it('should return a number without milliseconds', () => {
            const result = nowInSeconds();

            // Should be less than current time in milliseconds
            expect(result).toBeLessThan(Date.now());
            // Should be roughly 1000x smaller than Date.now()
            expect(result).toBeCloseTo(Date.now() / 1000, -2);
        });
    });

    describe('roundToDecimal', () => {
        it('should round to 2 decimal places by default', () => {
            expect(roundToDecimal(1.2345)).toBe(1.23);
            expect(roundToDecimal(1.235)).toBe(1.24);
            expect(roundToDecimal(0.999)).toBe(1);
            expect(roundToDecimal(-1.235)).toBe(-1.24);
        });

        it('should round to specified number of decimal places', () => {
            expect(roundToDecimal(1.2345, 3)).toBe(1.235);
            expect(roundToDecimal(1.2345, 1)).toBe(1.2);
            expect(roundToDecimal(1.2345, 0)).toBe(1);
            expect(roundToDecimal(1.5678, 2)).toBe(1.57);
        });

        it('should handle edge cases', () => {
            expect(roundToDecimal(0, 2)).toBe(0);
            expect(roundToDecimal(1000, 2)).toBe(1000);
            expect(roundToDecimal(0.001, 2)).toBe(0);
            expect(roundToDecimal(0.005, 2)).toBe(0.01);
        });
    });
});
