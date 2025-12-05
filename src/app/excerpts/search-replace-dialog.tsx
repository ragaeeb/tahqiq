'use client';

import { AlertCircle, CheckCircle2, SearchIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAvailableTokens, TOKEN_PATTERNS } from '@/lib/search-tokens';
import type { Excerpt, Heading } from '@/stores/excerptsStore/types';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';

type TargetField = 'nass' | 'text';
type TargetScope = 'excerpts' | 'headings' | 'footnotes';

type MatchResult = { id: string; original: string; replaced: string; field: TargetField };

type SearchReplaceDialogContentProps = { activeTab: string; initialSearchPattern?: string };

/**
 * Builds a RegExp from a search pattern string.
 * Supports literal text, regex patterns (/pattern/flags), and template tokens ({{raqm}})
 */
function buildSearchRegex(pattern: string): RegExp | null {
    if (!pattern) {
        return null;
    }

    // Check for regex pattern: /pattern/flags
    const regexMatch = pattern.match(/^\/(.+)\/([gimsuy]*)$/);
    if (regexMatch) {
        try {
            const flags = regexMatch[2].includes('g') ? regexMatch[2] : `g${regexMatch[2]}`;
            return new RegExp(regexMatch[1], flags.includes('u') ? flags : `${flags}u`);
        } catch {
            return null;
        }
    }

    // Check for template tokens: {{tokenName}}
    const tokenRegex = /\{\{(\w+)\}\}/g;
    if (tokenRegex.test(pattern)) {
        tokenRegex.lastIndex = 0;
        const expanded = pattern.replace(tokenRegex, (_match, tokenName: string) => {
            return TOKEN_PATTERNS[tokenName] || _match;
        });
        try {
            return new RegExp(expanded, 'gu');
        } catch {
            return null;
        }
    }

    // Literal text - escape special regex characters
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, 'gu');
}

/**
 * Finds matches in data and returns preview results
 */
function findMatches(
    data: (Excerpt | Heading)[],
    searchPattern: string,
    replacePattern: string,
    targetField: TargetField,
): MatchResult[] {
    if (!searchPattern) {
        return [];
    }

    const regex = buildSearchRegex(searchPattern);
    if (!regex) {
        return [];
    }

    const results: MatchResult[] = [];

    for (const item of data) {
        const fieldValue = targetField === 'nass' ? item.nass : item.text;
        if (!fieldValue) {
            continue;
        }

        regex.lastIndex = 0;
        if (regex.test(fieldValue)) {
            regex.lastIndex = 0;
            const replaced = fieldValue.replace(regex, replacePattern);
            if (replaced !== fieldValue) {
                results.push({ field: targetField, id: item.id, original: fieldValue, replaced });
            }
        }
    }

    return results.slice(0, 100);
}

/**
 * Match preview item component
 */
function MatchPreviewItem({ match }: { match: MatchResult }) {
    const truncate = (text: string) => (text.length > 100 ? `${text.slice(0, 100)}...` : text);

    return (
        <div className="p-2 text-sm">
            <div className="flex gap-2">
                <span className="w-12 shrink-0 font-mono text-muted-foreground text-xs">{match.id.slice(0, 8)}</span>
                <div className="flex-1 space-y-1" dir="auto">
                    <div className="break-all text-red-600/70 line-through">{truncate(match.original)}</div>
                    <div className="break-all text-green-600">{truncate(match.replaced)}</div>
                </div>
            </div>
        </div>
    );
}

/**
 * Token reference panel with clickable tokens
 */
function TokenReference({ onInsert }: { onInsert: (token: string) => void }) {
    const tokens = getAvailableTokens();

    return (
        <div className="rounded-lg border bg-muted/50 p-3">
            <Label className="font-medium text-muted-foreground text-xs">Available Tokens:</Label>
            <div className="mt-2 flex flex-wrap gap-2">
                {tokens.map((token) => (
                    <button
                        className="rounded bg-primary/10 px-2 py-1 font-mono text-primary text-xs transition-colors hover:bg-primary/20"
                        key={token}
                        onClick={() => onInsert(`{{${token}}}`)}
                        type="button"
                    >
                        {`{{${token}}}`}
                    </button>
                ))}
            </div>
            <p className="mt-2 text-muted-foreground text-xs">
                Click to insert. Use regex modifiers: <code className="bg-muted px-1">{'{{raqm}}+'}</code> for one+
            </p>
        </div>
    );
}

/**
 * Search and Replace dialog content for excerpts, headings, and footnotes.
 * This is the content component - use with DialogTriggerButton for lazy loading.
 */
export function SearchReplaceDialogContent({ activeTab, initialSearchPattern = '' }: SearchReplaceDialogContentProps) {
    const [searchPattern, setSearchPattern] = useState(initialSearchPattern);
    const [replacePattern, setReplacePattern] = useState('');
    const [targetField, setTargetField] = useState<TargetField>('nass');
    const [appliedCount, setAppliedCount] = useState<number | null>(null);

    const excerpts = useExcerptsStore((state) => state.excerpts);
    const headings = useExcerptsStore((state) => state.headings);
    const footnotes = useExcerptsStore((state) => state.footnotes);
    const updateExcerpt = useExcerptsStore((state) => state.updateExcerpt);
    const updateHeading = useExcerptsStore((state) => state.updateHeading);
    const updateFootnote = useExcerptsStore((state) => state.updateFootnote);

    const scope: TargetScope = activeTab as TargetScope;

    const currentData = useMemo(() => {
        if (scope === 'headings') {
            return headings;
        }
        if (scope === 'footnotes') {
            return footnotes;
        }
        return excerpts;
    }, [scope, excerpts, headings, footnotes]);

    const matches = useMemo(
        () => findMatches(currentData, searchPattern, replacePattern, targetField),
        [searchPattern, replacePattern, targetField, currentData],
    );

    const handleApply = useCallback(() => {
        if (!searchPattern || matches.length === 0) {
            return;
        }

        const regex = buildSearchRegex(searchPattern);
        if (!regex) {
            return;
        }

        let count = 0;
        const updateFn = scope === 'headings' ? updateHeading : scope === 'footnotes' ? updateFootnote : updateExcerpt;

        for (const item of currentData) {
            const fieldValue = targetField === 'nass' ? item.nass : item.text;
            if (!fieldValue) {
                continue;
            }

            regex.lastIndex = 0;
            if (regex.test(fieldValue)) {
                regex.lastIndex = 0;
                const replaced = fieldValue.replace(regex, replacePattern);
                if (replaced !== fieldValue) {
                    updateFn(item.id, { [targetField]: replaced });
                    count++;
                }
            }
        }

        record('SearchReplace', `${scope}:${targetField}:${count}`);
        setAppliedCount(count);
        setTimeout(() => setAppliedCount(null), 3000);
    }, [
        searchPattern,
        replacePattern,
        targetField,
        currentData,
        scope,
        matches.length,
        updateExcerpt,
        updateHeading,
        updateFootnote,
    ]);

    const handleInsertToken = useCallback((token: string) => {
        setSearchPattern((prev) => `${prev}${token}`);
    }, []);

    return (
        <DialogContent className="flex max-h-[85vh] w-[90vw] max-w-4xl flex-col">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <SearchIcon className="h-5 w-5" />
                    Search & Replace
                </DialogTitle>
                <DialogDescription>
                    Search using text, regex (/pattern/g), or tokens ({'{{raqms}}'}). Replace with text or capture
                    groups ($1, $2).
                </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
                {/* Target Field Selection */}
                <div className="flex items-center gap-4">
                    <Label className="w-20">Field:</Label>
                    <RadioGroup
                        className="flex gap-4"
                        onValueChange={(v: string) => setTargetField(v as TargetField)}
                        value={targetField}
                    >
                        <div className="flex items-center gap-2">
                            <RadioGroupItem id="nass" value="nass" />
                            <Label htmlFor="nass">Arabic (nass)</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <RadioGroupItem id="text" value="text" />
                            <Label htmlFor="text">Translation (text)</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Search Pattern */}
                <div className="flex items-center gap-4">
                    <Label className="w-20" htmlFor="search">
                        Find:
                    </Label>
                    <Input
                        className="flex-1 font-mono"
                        dir="auto"
                        id="search"
                        onChange={(e) => setSearchPattern(e.target.value)}
                        placeholder="Text, /regex/g, or {{raqms}}"
                        value={searchPattern}
                    />
                </div>

                {/* Replace Pattern */}
                <div className="flex items-center gap-4">
                    <Label className="w-20" htmlFor="replace">
                        Replace:
                    </Label>
                    <Input
                        className="flex-1 font-mono"
                        dir="auto"
                        id="replace"
                        onChange={(e) => setReplacePattern(e.target.value)}
                        placeholder="Replacement text or $1, $2..."
                        value={replacePattern}
                    />
                </div>

                <TokenReference onInsert={handleInsertToken} />

                {/* Preview Section */}
                {searchPattern && (
                    <div className="rounded-lg border">
                        <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
                            <span className="font-medium text-sm">
                                Preview ({matches.length} match{matches.length !== 1 ? 'es' : ''})
                            </span>
                            {matches.length > 100 && (
                                <span className="text-muted-foreground text-xs">Showing first 100</span>
                            )}
                        </div>
                        <ScrollArea className="h-[200px]">
                            {matches.length === 0 ? (
                                <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>No matches found</span>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {matches.map((match) => (
                                        <MatchPreviewItem key={match.id} match={match} />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                )}

                {/* Success message */}
                {appliedCount !== null && (
                    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Successfully replaced in {appliedCount} items</span>
                    </div>
                )}
            </div>

            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button disabled={matches.length === 0} onClick={handleApply}>
                    Replace All ({matches.length})
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
