/**
 * Token-based search templates for Arabic text patterns.
 * Maps human-readable tokens to regex patterns.
 */

/** Token definitions mapping token names to regex patterns */
export const TOKEN_PATTERNS: Record<string, string> = {
    /** Dash variants (hyphen, en-dash, em-dash, tatweel) */
    dash: '[-–—ـ]',
    /** Single Arabic letter (أ-ي) */
    harf: '[أ-ي]',
    /** One or more Arabic letters */
    harfs: '[أ-ي]+',
    /** Single Arabic-Indic digit (٠-٩) */
    raqm: '[\u0660-\u0669]',
    /** One or more Arabic-Indic digits */
    raqms: '[\u0660-\u0669]+',
};

/** Token pattern: {{tokenName}} */
const TOKEN_REGEX = /\{\{(\w+)\}\}/g;

/**
 * Checks if a query contains template tokens
 */
export function containsTokens(query: string): boolean {
    // Reset lastIndex since TOKEN_REGEX is global
    TOKEN_REGEX.lastIndex = 0;
    return TOKEN_REGEX.test(query);
}

/**
 * Expands template tokens in a query string to their regex equivalents.
 * Unknown tokens are left as-is.
 *
 * @example
 * expandTokens('، {{raqms}}') // → '، [\u0660-\u0669]+'
 * expandTokens('{{raqm}}*')   // → '[\u0660-\u0669]*'
 * expandTokens('{{dash}}{{raqm}}') // → '[-–—ـ][\u0660-\u0669]'
 */
export function expandTokens(query: string): string {
    // Reset regex lastIndex for global regex
    TOKEN_REGEX.lastIndex = 0;

    return query.replace(TOKEN_REGEX, (match, tokenName: string) => {
        // Unknown token - leave as-is (will likely cause invalid regex)
        return TOKEN_PATTERNS[tokenName] || match;
    });
}

/**
 * Converts a template string to a RegExp.
 * Returns null if the resulting pattern is invalid.
 *
 * @example
 * templateToRegex('، {{raqms}}') // → /، [\u0660-\u0669]+/u
 */
export function templateToRegex(template: string): RegExp | null {
    const expanded = expandTokens(template);
    try {
        return new RegExp(expanded, 'u');
    } catch {
        return null;
    }
}

/**
 * Lists all available token names
 */
export function getAvailableTokens(): string[] {
    return Object.keys(TOKEN_PATTERNS);
}

/**
 * Gets the regex pattern for a specific token
 */
export function getTokenPattern(tokenName: string): string | undefined {
    return TOKEN_PATTERNS[tokenName];
}
