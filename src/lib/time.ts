/**
 * Returns the current Unix timestamp in seconds (not milliseconds).
 * Used for lastUpdatedAt fields which track time in seconds for data persistence.
 */
export const nowInSeconds = () => Math.floor(Date.now() / 1000);

/**
 * Converts a time string to seconds
 * @param str - Time string in "HH:MM:SS", "MM:SS", or number format
 * @returns Total seconds as a number
 */
export const timeToSeconds = (str: string) => {
    const parts = str.split(':').map((p) => parseInt(p, 10));

    if (parts.length === 3) {
        return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
    }

    if (parts.length === 2) {
        return parts[0]! * 60 + parts[1]!;
    }
    return parseInt(str, 10) || 0;
};

/**
 * Rounds a number to a specified number of decimal places
 * @param value - The number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 */
export const roundToDecimal = (value: number, decimals: number = 2) => {
    return Math.round(value * 10 ** decimals) / 10 ** decimals;
};
