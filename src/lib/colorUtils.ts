/**
 * Color utilities for generating distinguishable colors from numeric values.
 * Uses HSL color space for better control over saturation and lightness.
 */

/**
 * Golden ratio conjugate - provides good distribution when multiplied repeatedly.
 * This ensures sequential numbers produce visually distinct hues.
 */
const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;

/**
 * Generates a pastel background color from a page number.
 * Uses the golden ratio to create well-distributed hues that are
 * visually distinct even for sequential numbers.
 *
 * The algorithm:
 * 1. Multiply by golden ratio conjugate to distribute hues evenly
 * 2. Use modulo to wrap around the hue wheel (0-360°)
 * 3. Fixed saturation (50%) for pastel appearance
 * 4. High lightness (85%) to ensure black text readability
 *
 * @param pageNumber - The page number to convert to a color
 * @returns HSL color string suitable for inline styles
 */
export const pageNumberToColor = (pageNumber: number): string => {
    // Multiply by golden ratio and take fractional part for even distribution
    // Adding a prime offset (17) helps differentiate page 0, 1, 2, etc.
    const hue = ((pageNumber + 17) * GOLDEN_RATIO_CONJUGATE * 360) % 360;

    // Saturation: 45-55% for pastel but still colorful
    // Lightness: 82-88% to ensure black text is readable
    const saturation = 50;
    const lightness = 85;

    return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
};

/**
 * Generates a slightly darker border/hover color for the same page number.
 * Useful for interactive states while maintaining color consistency.
 *
 * @param pageNumber - The page number to convert to a color
 * @returns HSL color string with lower lightness
 */
export const pageNumberToHoverColor = (pageNumber: number): string => {
    const hue = ((pageNumber + 17) * GOLDEN_RATIO_CONJUGATE * 360) % 360;
    return `hsl(${Math.round(hue)}, 55%, 78%)`;
};
