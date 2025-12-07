import { expandTokens } from '../search-tokens';
import type { PageInput, Segment, SegmentationOptions, SplitRule } from './types';

const stripHtmlTags = (content: string): string => content.replace(/<[^>]*>/g, '');

const normalizeLineEndings = (content: string): string => content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const buildRuleRegex = (rule: SplitRule): RegExp => {
    const s: { lineStartsWith?: string[]; lineEndsWith?: string[]; template?: string; regex?: string } = { ...rule };

    if (s.lineStartsWith?.length) {
        s.template = `^(?:${s.lineStartsWith.join('|')})`;
    }
    if (s.lineEndsWith?.length) {
        s.template = `(?:${s.lineEndsWith.join('|')})$`;
    }
    if (s.template) {
        s.regex = expandTokens(s.template);
    }

    return new RegExp(s.regex!, 'gmu');
};

type PageBoundary = { start: number; end: number; id: number };
type PageMap = { getId: (offset: number) => number; boundaries: PageBoundary[]; pageBreaks: Set<number> };

const buildPageMap = (pages: PageInput[]): { content: string; pageMap: PageMap } => {
    const boundaries: PageBoundary[] = [];
    const pageBreaks = new Set<number>();
    let offset = 0;
    const parts: string[] = [];

    for (let i = 0; i < pages.length; i++) {
        const normalized = normalizeLineEndings(pages[i].content);
        boundaries.push({ end: offset + normalized.length, id: pages[i].id, start: offset });
        parts.push(normalized);
        if (i < pages.length - 1) {
            pageBreaks.add(offset + normalized.length);
            offset += normalized.length + 1;
        } else {
            offset += normalized.length;
        }
    }

    const findBoundary = (off: number): PageBoundary | undefined => {
        for (const b of boundaries) {
            if (off >= b.start && off <= b.end) {
                return b;
            }
        }
        return boundaries[boundaries.length - 1];
    };

    return {
        content: parts.join('\n'),
        pageMap: { boundaries, getId: (off: number) => findBoundary(off)?.id ?? 0, pageBreaks },
    };
};

type SplitPoint = { index: number; meta?: Record<string, unknown> };

const findMatches = (content: string, regex: RegExp): Array<{ start: number; end: number }> => {
    const matches: Array<{ start: number; end: number }> = [];
    regex.lastIndex = 0;
    let m = regex.exec(content);
    while (m !== null) {
        matches.push({ end: m.index + m[0].length, start: m.index });
        if (m[0].length === 0) {
            regex.lastIndex++;
        }
        m = regex.exec(content);
    }
    return matches;
};

const filterByOccurrence = (
    matches: Array<{ start: number; end: number }>,
    occurrence?: 'first' | 'last' | 'all',
): Array<{ start: number; end: number }> => {
    if (!matches.length) {
        return [];
    }
    if (occurrence === 'first') {
        return [matches[0]];
    }
    if (occurrence === 'last') {
        return [matches[matches.length - 1]];
    }
    return matches;
};

const convertPageBreaks = (content: string, startOffset: number, pageBreaks: Set<number>): string => {
    return content
        .split('')
        .map((c, i) => (c === '\n' && pageBreaks.has(startOffset + i) ? ' ' : c))
        .join('');
};

export function segmentPages(pages: PageInput[], options: SegmentationOptions): Segment[] {
    const { rules = [], stripHtml = false } = options;
    if (!rules.length || !pages.length) {
        return [];
    }

    // If stripHtml is true, strip HTML BEFORE building pageMap so boundaries are consistent
    const processedPages = stripHtml ? pages.map((p) => ({ ...p, content: stripHtmlTags(p.content) })) : pages;

    const { content: matchContent, pageMap } = buildPageMap(processedPages);

    const splitPoints: SplitPoint[] = [];
    for (const rule of rules) {
        const regex = buildRuleRegex(rule);
        const allMatches = findMatches(matchContent, regex);

        // Filter matches by ID constraints first
        const constrainedMatches = allMatches.filter((m) => {
            const id = pageMap.getId(m.start);
            if (rule.min !== undefined && id < rule.min) {
                return false;
            }
            if (rule.max !== undefined && id > rule.max) {
                return false;
            }
            return true;
        });

        // Apply occurrence filtering
        let finalMatches: Array<{ start: number; end: number }>;

        if (rule.maxSpan !== undefined && rule.maxSpan > 0) {
            // Group matches by ID-groups of maxSpan size
            // Uses unique ID (not page number) to handle duplicate page numbers
            // e.g., maxSpan: 1 = per-entry, maxSpan: 2 = entries 0-1, 2-3, etc.
            const matchesByGroup = new Map<number, Array<{ start: number; end: number }>>();
            for (const m of constrainedMatches) {
                const id = pageMap.getId(m.start);
                const groupKey = Math.floor(id / rule.maxSpan);
                if (!matchesByGroup.has(groupKey)) {
                    matchesByGroup.set(groupKey, []);
                }
                matchesByGroup.get(groupKey)!.push(m);
            }

            finalMatches = [];
            for (const groupMatches of matchesByGroup.values()) {
                const filtered = filterByOccurrence(groupMatches, rule.occurrence);
                finalMatches.push(...filtered);
            }
        } else {
            // Global occurrence filtering (default)
            finalMatches = filterByOccurrence(constrainedMatches, rule.occurrence);
        }

        for (const m of finalMatches) {
            splitPoints.push({ index: rule.split === 'before' ? m.start : m.end, meta: rule.meta });
        }
    }

    splitPoints.sort((a, b) => a.index - b.index);
    const unique = splitPoints.filter((p, i) => i === 0 || p.index !== splitPoints[i - 1].index);

    const segments: Segment[] = [];
    const mkSeg = (start: number, end: number, meta?: Record<string, unknown>): Segment | null => {
        let text = matchContent.slice(start, end).replace(/[\s\n]+$/, '');
        if (!text) {
            return null;
        }
        text = convertPageBreaks(text, start, pageMap.pageBreaks);
        const from = pageMap.getId(start);
        const to = pageMap.getId(start + text.length - 1);
        const seg: Segment = { content: text, from };
        if (to !== from) {
            seg.to = to;
        }
        if (meta) {
            seg.meta = meta;
        }
        return seg;
    };

    if (!unique.length) {
        // No split points found - return entire content as one segment if ANY rule would allow it
        const firstId = pageMap.getId(0);
        const anyRuleAllows = rules.some((r) => {
            const minOk = r.min === undefined || firstId >= r.min;
            const maxOk = r.max === undefined || firstId <= r.max;
            return minOk && maxOk;
        });
        if (anyRuleAllows) {
            const s = mkSeg(0, matchContent.length);
            if (s) {
                segments.push(s);
            }
        }
        return segments;
    }

    // Add first segment (0 to first split point) if there's content before first match
    // Only include if ANY rule allows the starting ID (not excluded by all rules)
    if (unique[0].index > 0) {
        const firstSegId = pageMap.getId(0);
        const anyRuleAllows = rules.some((r) => {
            const minOk = r.min === undefined || firstSegId >= r.min;
            const maxOk = r.max === undefined || firstSegId <= r.max;
            return minOk && maxOk;
        });
        if (anyRuleAllows) {
            const s = mkSeg(0, unique[0].index);
            if (s) {
                segments.push(s);
            }
        }
    }

    // Remaining segments from split points
    for (let i = 0; i < unique.length; i++) {
        const start = unique[i].index;
        const end = i < unique.length - 1 ? unique[i + 1].index : matchContent.length;
        const s = mkSeg(start, end, unique[i].meta);
        if (s) {
            segments.push(s);
        }
    }

    return segments;
}
