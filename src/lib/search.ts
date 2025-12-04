/**
 * Extensible search utilities for text matching.
 * Supports literal text matching, regex patterns, and template tokens.
 */

import { containsTokens, templateToRegex } from './search-tokens';

/** Search strategy types */
export type SearchStrategy = 'literal' | 'regex' | 'template';

/** Function that tests if text matches a search query */
export type TextMatcher = (text: string | undefined | null) => boolean;

/** Regex pattern format: /pattern/flags */
const REGEX_PATTERN = /^\/(.+)\/([gimsuy]*)$/;

/**
 * Detects if query is a regex pattern: /pattern/flags
 */
export function isRegexPattern(query: string): boolean {
    return REGEX_PATTERN.test(query);
}

/**
 * Detects if query contains template tokens: {{tokenName}}
 */
export function isTemplatePattern(query: string): boolean {
    return containsTokens(query);
}

/**
 * Parses regex string into RegExp object.
 * Handles Unicode patterns like /^[\u0660-\u0669]+/
 * @returns RegExp if valid, null if invalid
 */
export function parseRegex(query: string): RegExp | null {
    const match = query.match(REGEX_PATTERN);
    if (!match) {
        return null;
    }

    const [, pattern, flags] = match;
    // Add unicode flag if not present for proper Arabic character handling
    const finalFlags = flags.includes('u') ? flags : `${flags}u`;

    try {
        return new RegExp(pattern, finalFlags);
    } catch {
        return null;
    }
}

/**
 * Detect search strategy from query string
 */
export function detectStrategy(query: string): SearchStrategy {
    if (isRegexPattern(query)) {
        return 'regex';
    }
    if (isTemplatePattern(query)) {
        return 'template';
    }
    return 'literal';
}

/**
 * Creates a text matcher function from query.
 * - Regex patterns (/pattern/flags) use RegExp.test()
 * - Template patterns (containing {{token}}) expand tokens to regex
 * - Plain text uses String.includes()
 *
 * @example
 * // Literal search
 * const matches = createMatcher('hello');
 * matches('hello world'); // true
 *
 * @example
 * // Regex search - find lines starting with Arabic numbers
 * const matches = createMatcher('/^[\u0660-\u0669]+/');
 * matches('١٢٣ text'); // true
 *
 * @example
 * // Template search - using tokens
 * const matches = createMatcher('، {{raqms}}');
 * matches('، ١٢٣'); // true
 */
export function createMatcher(query: string): TextMatcher {
    // Try regex pattern first: /pattern/flags
    if (isRegexPattern(query)) {
        const regex = parseRegex(query);
        if (regex) {
            return (text) => text != null && regex.test(text);
        }
    }

    // Try template pattern: contains {{token}}
    if (isTemplatePattern(query)) {
        const regex = templateToRegex(query);
        if (regex) {
            return (text) => text != null && regex.test(text);
        }
    }

    // Fallback to literal includes
    return (text) => text != null && text.includes?.(query);
}
