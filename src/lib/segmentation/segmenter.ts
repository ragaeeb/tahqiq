import { expandTokens } from '../search-tokens';
import type { PageInput, Segment, SegmentationOptions, SlicingOption } from './types';

/**
 * Strips HTML tags from content, preserving text content
 */
const stripHtmlTags = (content: string): string => {
    return content.replace(/<[^>]*>/g, '');
};

/**
 * Normalizes line endings and splits content into lines
 */
const splitIntoLines = (content: string): string[] => {
    return content
        .replace(/\r\n/g, '\r')
        .replace(/\n/g, '\r')
        .split('\r')
        .filter((line) => line.length > 0);
};

/**
 * Builds a RegExp from a SlicingOption.
 * Pipeline: lineStartsWith → template → regex → RegExp
 */
const buildSliceRegex = (slice: SlicingOption): RegExp | null => {
    // Local mutable copy for pipeline transformations
    const s: { lineStartsWith?: string[]; template?: string; regex?: string } = { ...slice };

    // Step 1: lineStartsWith → template (non-capturing group)
    if (s.lineStartsWith?.length) {
        s.template = `^(?:${s.lineStartsWith.join('|')})`;
    }

    // Step 2: template → regex (expand tokens)
    if (s.template) {
        s.regex = expandTokens(s.template);
    }

    return new RegExp(s.regex!, 'u');
};

/**
 * Counts the number of capture groups in a regex pattern
 */
const countCaptureGroups = (regex: RegExp): number => {
    // Test with an empty-ish string to get the match structure
    const testMatch = new RegExp(`${regex.source}|`).exec('');
    return testMatch ? testMatch.length - 1 : 0;
};

/**
 * Match result with optional captures
 */
type MatchResult = {
    matched: boolean;
    meta?: SlicingOption['meta'];
    /** Extracted content from capture groups (if any) - last non-empty capture */
    extractedContent?: string;
    /** All capture groups for metadata (including IDs) */
    allCaptures?: string[];
};

/**
 * Tests if a line matches any slice pattern and extracts captures
 */
const matchesSlicePattern = (
    line: string,
    patterns: Array<{ regex: RegExp; meta?: SlicingOption['meta']; hasCaptures: boolean; min?: number; max?: number }>,
    pageNumber: number,
): MatchResult => {
    for (const { regex, meta, hasCaptures, min, max } of patterns) {
        // Skip patterns outside page range
        if (min !== undefined && pageNumber < min) {
            continue;
        }
        if (max !== undefined && pageNumber > max) {
            continue;
        }

        const match = regex.exec(line);
        if (match) {
            if (hasCaptures && match.length > 1) {
                // Has capture groups - extract content from them
                const captures = match.slice(1).filter((c) => c !== undefined);
                // Filter out empty strings for content, but keep all for metadata
                const nonEmptyCaptures = captures.filter((c) => c.trim().length > 0);
                // Use last non-empty capture as content (the main captured text)
                const lastNonEmpty = nonEmptyCaptures[nonEmptyCaptures.length - 1];

                return { allCaptures: captures, extractedContent: lastNonEmpty, matched: true, meta };
            }
            return { matched: true, meta };
        }
    }
    return { matched: false };
};

/**
 * Segmentation context for tracking state during processing
 */
type SegmentationContext = {
    segments: Segment[];
    current: {
        /** Lines of content (plain text if stripHtml) */
        lines: string[];
        /** Lines of original HTML (only when stripHtml is true) */
        htmlLines?: string[];
        from: number;
        to?: number;
        meta?: SlicingOption['meta'];
        captures?: string[];
    } | null;
    /** Whether to strip HTML from content */
    stripHtml: boolean;
};

/**
 * Finalizes the current segment and adds it to results
 */
const finalizeCurrentSegment = (ctx: SegmentationContext): void => {
    if (ctx.current && ctx.current.lines.length > 0) {
        const segment: Segment = { content: ctx.current.lines.join('\n'), from: ctx.current.from };
        if (ctx.current.to !== undefined && ctx.current.to !== ctx.current.from) {
            segment.to = ctx.current.to;
        }
        if (ctx.current.meta) {
            segment.meta = ctx.current.meta;
        }
        if (ctx.current.captures && ctx.current.captures.length > 0) {
            segment.captures = ctx.current.captures;
        }
        if (ctx.stripHtml && ctx.current.htmlLines && ctx.current.htmlLines.length > 0) {
            segment.html = ctx.current.htmlLines.join('\n');
        }
        ctx.segments.push(segment);
    }
    ctx.current = null;
};

/**
 * Starts a new segment
 */
const startNewSegment = (
    ctx: SegmentationContext,
    line: string,
    htmlLine: string | undefined,
    pageId: number,
    meta?: SlicingOption['meta'],
    captures?: string[],
): void => {
    ctx.current = {
        captures,
        from: pageId,
        htmlLines: htmlLine !== undefined ? [htmlLine] : undefined,
        lines: [line],
        meta,
    };
};

/**
 * Appends a line to the current segment
 */
const appendToCurrentSegment = (
    ctx: SegmentationContext,
    line: string,
    htmlLine: string | undefined,
    pageId: number,
    useSpace: boolean,
): void => {
    if (ctx.current) {
        if (useSpace) {
            // Joining from previous page - use space instead of line break
            const lastIndex = ctx.current.lines.length - 1;
            ctx.current.lines[lastIndex] = `${ctx.current.lines[lastIndex]} ${line}`;
            if (ctx.current.htmlLines && htmlLine !== undefined) {
                ctx.current.htmlLines[lastIndex] = `${ctx.current.htmlLines[lastIndex]} ${htmlLine}`;
            }
        } else {
            ctx.current.lines.push(line);
            if (ctx.current.htmlLines && htmlLine !== undefined) {
                ctx.current.htmlLines.push(htmlLine);
            }
        }
        if (pageId !== ctx.current.from) {
            ctx.current.to = pageId;
        }
    }
};

/**
 * Segments pages into excerpts based on slicing options.
 *
 * Algorithm:
 * 1. For each page, split content into lines
 * 2. If stripHtml is true, also create stripped version for matching
 * 3. For each line, test against slice patterns (on stripped text if stripHtml)
 * 4. If pattern matches: finalize current segment, start new one
 *    - If pattern has capture groups, use captured content instead of full line
 * 5. If no match: append to current segment
 * 6. Cross-page content is joined with space (not newline)
 * 7. When stripHtml, content is plain text and html preserves original
 */
export function segmentPages(pages: PageInput[], options: SegmentationOptions): Segment[] {
    const slices = options.slices || [];
    const shouldStripHtml = options.stripHtml ?? false;

    // Build regex patterns from slicing options
    const patterns: Array<{
        regex: RegExp;
        meta?: SlicingOption['meta'];
        hasCaptures: boolean;
        min?: number;
        max?: number;
    }> = [];
    for (const slice of slices) {
        const regex = buildSliceRegex(slice);
        if (regex) {
            const hasCaptures = countCaptureGroups(regex) > 0;
            patterns.push({ hasCaptures, max: slice.max, meta: slice.meta, min: slice.min, regex });
        }
    }

    // If no patterns, return empty (nothing to segment by)
    if (patterns.length === 0) {
        return [];
    }

    const ctx: SegmentationContext = { current: null, segments: [], stripHtml: shouldStripHtml };

    for (const page of pages) {
        const htmlLines = splitIntoLines(page.content);
        const strippedLines = shouldStripHtml ? htmlLines.map(stripHtmlTags) : htmlLines;
        let isFirstLineOfPage = true;

        for (let i = 0; i < strippedLines.length; i++) {
            const strippedLine = strippedLines[i];
            const htmlLine = htmlLines[i];

            // Always match patterns against ORIGINAL HTML (for HTML-aware patterns)
            // Content output uses stripped text when stripHtml is true
            const result = matchesSlicePattern(htmlLine, patterns, page.page);

            if (result.matched) {
                // Finalize previous segment, start new one
                finalizeCurrentSegment(ctx);

                // When stripHtml is true, use stripped line as content
                // (HTML-based captures are stripped separately below)
                // Otherwise, use extracted content if available
                const content = shouldStripHtml ? strippedLine : (result.extractedContent ?? htmlLine);

                // For captures, if we're stripping HTML, re-apply captures to stripped content
                let captures = result.allCaptures;
                if (shouldStripHtml && captures) {
                    captures = captures.map(stripHtmlTags);
                }

                startNewSegment(ctx, content, shouldStripHtml ? htmlLine : undefined, page.id, result.meta, captures);
            } else if (ctx.current) {
                // Append to current segment
                // Use space joining if this is the first line of a new page
                const useSpace = isFirstLineOfPage && page.id !== ctx.current.from;
                appendToCurrentSegment(ctx, strippedLine, shouldStripHtml ? htmlLine : undefined, page.id, useSpace);
            }
            // If no current segment and no match, the line is dropped (pre-first-marker content)

            isFirstLineOfPage = false;
        }
    }

    // Finalize any remaining segment
    finalizeCurrentSegment(ctx);

    return ctx.segments;
}
