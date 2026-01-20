import { parsePageRanges } from 'bitaboom';
import type { Page } from 'flappa-doormal';

/**
 * - Default regex flags: `gu` (global + unicode)
 * - If `flags` is provided, it is validated and merged with required flags:
 *   `g` and `u` are always enforced.
 *
 * `pages` controls which pages a rule applies to:
 * - `undefined`: apply to all pages
 * - `[]`: apply to no pages (rule is skipped)
 * - `["1", "5-10", "12+"]`: apply only to those pages
 */
export type Replacement = {
    /** Raw regex source string (no token expansion). Compiled with `u` (and always `g`). */
    regex: string;
    /** Replacement string (passed to `String.prototype.replace`). */
    replacement: string;
    /** Optional regex flags; `g` and `u` are always enforced. */
    flags?: string;
    /**
     * Can be page numbers (separated by commas), ranges, or extremeties.
     * @example "1,2,3" for pages 1-3
     * @example "1-3" for pages 1-3
     * @example "1-2,3" for pages 1-2 and page 3
     * @example "1+" matches on all pages after page 1, (1 to infinity)
     * Empty string means skip.
     */
    pages?: string;
};

const DEFAULT_REPLACE_FLAGS = 'gu';

const normalizeReplaceFlags = (flags?: string) => {
    if (flags === undefined) {
        return DEFAULT_REPLACE_FLAGS;
    }

    const allowed = new Set(['g', 'i', 'm', 's', 'u', 'y']);
    const set = new Set(
        flags.split('').filter((ch) => {
            if (!allowed.has(ch)) {
                throw new Error(`Invalid replace regex flag: "${ch}" (allowed: gimsyu)`);
            }
            return true;
        }),
    );
    set.add('u');

    return ['g', 'i', 'm', 's', 'y', 'u'].filter((c) => set.has(c)).join('');
};

const createPageMatcher = (pages?: string) => {
    if (!pages) {
        return () => true;
    }

    const staticSet = new Set<number>();
    const openRanges: number[] = [];

    for (const p of pages.split(',').map((p) => p.trim())) {
        if (p.endsWith('+')) {
            const start = Number.parseInt(p.slice(0, -1), 10);
            if (!Number.isNaN(start)) {
                openRanges.push(start);
            }
        } else {
            try {
                for (const n of parsePageRanges(p)) {
                    staticSet.add(n);
                }
            } catch {}
        }
    }

    return (pageIdStr: string) => {
        const pageId = Number.parseInt(pageIdStr, 10);
        if (Number.isNaN(pageId)) {
            return false;
        }
        return staticSet.has(pageId) || openRanges.some((start) => pageId >= start);
    };
};

const compileReplaceRules = (rules: Replacement[]) => {
    return rules
        .filter((r) => r.pages !== '')
        .map((r) => ({
            isMatch: createPageMatcher(r.pages),
            re: new RegExp(r.regex, normalizeReplaceFlags(r.flags)),
            replacement: r.replacement,
        }));
};

export const applyReplacements = (pages: Page[], rules?: Replacement[]) => {
    if (!rules?.length || !pages.length) {
        return pages;
    }

    const compiled = compileReplaceRules(rules);
    if (!compiled.length) {
        return pages;
    }

    return pages.map((p) => {
        let content = p.content;
        for (const rule of compiled) {
            if (rule.isMatch(String(p.id))) {
                content = content.replace(rule.re, rule.replacement);
            }
        }
        return content === p.content ? p : { ...p, content };
    });
};
