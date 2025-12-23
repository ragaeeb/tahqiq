'use client';

import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useCallback, useMemo, useRef } from 'react';
import { convertContentToMarkdown } from 'shamela';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Replacement } from '@/stores/segmentationStore/types';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';
import { useShamelaStore } from '@/stores/shamelaStore/useShamelaStore';

/**
 * Count total matches of a regex pattern across all pages
 */
const countMatches = (pattern: string, pages: { body: string }[]): number => {
    if (!pattern.trim()) {
        return 0;
    }

    try {
        const regex = new RegExp(pattern, 'gu');
        let total = 0;

        for (const page of pages) {
            const content = convertContentToMarkdown(page.body);
            const matches = content.match(regex);
            if (matches) {
                total += matches.length;
            }
        }

        return total;
    } catch {
        return -1; // Invalid regex
    }
};

type ReplacementRowProps = {
    index: number;
    replacement: Replacement;
    matchCount: number;
    onUpdate: (index: number, field: 'regex' | 'replacement', value: string) => void;
    onDelete: (index: number) => void;
};

/**
 * Single row for a replacement pair with uncontrolled inputs
 */
const ReplacementRow = ({ index, replacement, matchCount, onUpdate, onDelete }: ReplacementRowProps) => {
    const regexRef = useRef<HTMLInputElement>(null);
    const replacementRef = useRef<HTMLInputElement>(null);

    const matchLabel =
        matchCount === -1 ? (
            <span className="text-destructive">Invalid regex</span>
        ) : matchCount > 0 ? (
            <span className="text-green-600">{matchCount.toLocaleString()} matches</span>
        ) : replacement.regex.trim() ? (
            <span className="text-muted-foreground">0 matches</span>
        ) : null;

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <Input
                    ref={regexRef}
                    className="flex-1 font-mono text-sm"
                    defaultValue={replacement.regex}
                    onBlur={(e) => onUpdate(index, 'regex', e.target.value)}
                    placeholder="Regex pattern"
                />
                <Input
                    ref={replacementRef}
                    className="flex-1 font-mono text-sm"
                    defaultValue={replacement.replacement}
                    onBlur={(e) => onUpdate(index, 'replacement', e.target.value)}
                    placeholder="Replacement"
                />
                <Button onClick={() => onDelete(index)} size="icon" variant="ghost">
                    <Trash2Icon className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>
            {matchLabel && <div className="text-xs">{matchLabel}</div>}
        </div>
    );
};

/**
 * Tab for configuring pre-processing replacements applied before segmentation.
 */
export const ReplacementsTab = () => {
    const { replacements, setReplacements } = useSegmentationStore();
    const pages = useShamelaStore((state) => state.pages);

    // Compute match counts for each replacement
    const matchCounts = useMemo(() => {
        return replacements.map((r) => countMatches(r.regex, pages));
    }, [replacements, pages]);

    const handleAdd = useCallback(() => {
        setReplacements([...replacements, { regex: '', replacement: '' }]);
    }, [replacements, setReplacements]);

    const handleUpdate = useCallback(
        (index: number, field: 'regex' | 'replacement', value: string) => {
            const updated = [...replacements];
            updated[index] = { ...updated[index], [field]: value };
            setReplacements(updated);
        },
        [replacements, setReplacements],
    );

    const handleDelete = useCallback(
        (index: number) => {
            setReplacements(replacements.filter((_, i) => i !== index));
        },
        [replacements, setReplacements],
    );

    return (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
            <div className="space-y-1">
                <Label>Pre-processing Replacements</Label>
                <p className="text-sm text-muted-foreground">
                    Define regex patterns and their replacements. These are applied to page content before segmentation.
                </p>
            </div>

            <div className="flex flex-col gap-3">
                {replacements.map((replacement, index) => (
                    <ReplacementRow
                        key={index}
                        index={index}
                        matchCount={matchCounts[index]}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                        replacement={replacement}
                    />
                ))}

                {replacements.length === 0 && (
                    <p className="text-sm italic text-muted-foreground">No replacements configured.</p>
                )}
            </div>

            <Button className="w-fit" onClick={handleAdd} variant="outline">
                <PlusIcon className="mr-1 h-4 w-4" />
                Add Replacement
            </Button>
        </div>
    );
};
