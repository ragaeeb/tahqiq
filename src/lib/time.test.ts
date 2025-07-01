import { describe, expect, it } from 'bun:test';

import { roundToDecimal, timeToSeconds } from './time';

describe('time', () => {
    describe('timeToSeconds', () => {
        it('should convert HH:MM:SS format correctly', () => {
            expect(timeToSeconds('01:30:45')).toBe(5445); // 1h + 30m + 45s
            expect(timeToSeconds('00:00:01')).toBe(1);
            expect(timeToSeconds('02:00:00')).toBe(7200);
        });

        it('should convert MM:SS format correctly', () => {
            expect(timeToSeconds('05:30')).toBe(330); // 5m + 30s
            expect(timeToSeconds('00:45')).toBe(45);
            expect(timeToSeconds('10:00')).toBe(600);
        });

        it('should handle numeric strings as seconds', () => {
            expect(timeToSeconds('90')).toBe(90);
            expect(timeToSeconds('0')).toBe(0);
            expect(timeToSeconds('3600')).toBe(3600);
        });

        it('should return 0 for invalid inputs', () => {
            expect(timeToSeconds('invalid')).toBe(0);
            expect(timeToSeconds('')).toBe(0);
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
