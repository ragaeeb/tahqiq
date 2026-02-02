export const mapUnixTimestampToSeconds = (t: number) => Math.floor(t / 1000);

export const mapDateToSeconds = (date: Date) => mapUnixTimestampToSeconds(date.getTime());

/**
 * Returns the current Unix timestamp in seconds (not milliseconds).
 * Used for lastUpdatedAt fields which track time in seconds for data persistence.
 */
export const nowInSeconds = () => mapUnixTimestampToSeconds(Date.now());

/**
 * Rounds a number to a specified number of decimal places
 * @param value - The number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 */
export const roundToDecimal = (value: number, decimals: number = 2) => {
    return Math.round(value * 10 ** decimals) / 10 ** decimals;
};
