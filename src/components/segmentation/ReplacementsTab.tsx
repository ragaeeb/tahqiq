'use client';

import { PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Replacement } from '@/lib/replace';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type ReplacementRowProps = {
    index: number;
    replacement: Replacement;
    onChange: (index: number, patch: Partial<Replacement>) => void;
    onDelete: (index: number) => void;
};

const SUGGESTED_REPLACEMENTS: { label: string; replacement: Replacement }[] = [
    { label: 'Ellipsis', replacement: { flags: 'g', regex: '\\.{2,}', replacement: '…' } },
];

const ReplacementRow = ({ index, replacement, onChange, onDelete }: ReplacementRowProps) => {
    const isRegexEmpty = replacement.regex.trim().length === 0;
    return (
        <div className="flex flex-col gap-2 rounded-md border bg-white p-3">
            <div className="flex items-center gap-2">
                <Input
                    className={`flex-1 font-mono text-sm ${isRegexEmpty ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    defaultValue={replacement.regex}
                    onBlur={(e) => {
                        onChange(index, { regex: e.target.value });
                    }}
                    placeholder="Regex pattern"
                />
                <Input
                    className="flex-1 font-mono text-sm"
                    defaultValue={replacement.replacement}
                    onBlur={(e) => {
                        onChange(index, { replacement: e.target.value });
                    }}
                    placeholder="Replacement"
                />
                <Button onClick={() => onDelete(index)} size="icon" type="button" variant="ghost">
                    <Trash2Icon className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>
            <div className="flex items-center gap-2">
                <Input
                    className="h-7 flex-1 font-mono text-xs"
                    defaultValue={replacement.pages ?? ''}
                    onBlur={(e) => {
                        onChange(index, { pages: e.target.value });
                    }}
                    placeholder="Pages (e.g. 1-3, 5, 10+). Leave empty for all pages."
                />
                <Select
                    onValueChange={(v) => onChange(index, { flags: v === 'none' ? '' : v })}
                    value={replacement.flags === '' ? 'none' : (replacement.flags ?? 'g')}
                >
                    <SelectTrigger className="h-7 w-[100px] font-mono text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem className="font-mono text-xs" value="g">
                            Global
                        </SelectItem>
                        <SelectItem className="font-mono text-xs" value="none">
                            None
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export const ReplacementsTab = () => {
    const replacements = useSegmentationStore((s) => s.options.replace) || [];
    const updateOptions = useSegmentationStore((s) => s.updateOptions);

    const setReplacements = (replace: Replacement[]) => updateOptions({ replace });

    const handleChange = (index: number, patch: Partial<Replacement>) => {
        const next = [...replacements];
        next[index] = { ...next[index], ...patch };
        setReplacements(next);
    };

    const handleDelete = (index: number) => {
        setReplacements(replacements.filter((_, i) => i !== index));
    };

    const addSuggestedReplacement = (r: Replacement, label: string) => {
        setReplacements([...replacements, r]);
        toast.success(`Added: ${label}`);
    };

    return (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-3">
            <div className="space-y-1">
                <Label>Pre-processing Replacements</Label>
                <p className="text-muted-foreground text-sm">
                    Applied to page content before segmentation. These are raw regex patterns (no token expansion).
                </p>
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
                <div className="mb-2 text-muted-foreground text-xs">Suggestions</div>
                <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_REPLACEMENTS.map((s) => (
                        <Button
                            className="bg-background"
                            key={s.label}
                            onClick={() => addSuggestedReplacement(s.replacement, s.label)}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            + {s.label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {replacements.map((replacement, index) => (
                    <ReplacementRow
                        index={index}
                        key={`${index}-${replacement.regex}`}
                        onChange={handleChange}
                        onDelete={handleDelete}
                        replacement={replacement}
                    />
                ))}

                {replacements.length === 0 && (
                    <p className="text-muted-foreground text-sm italic">No replacements configured.</p>
                )}
            </div>

            <Button
                className="w-fit"
                onClick={() => setReplacements([...replacements, { regex: '', replacement: '' }])}
                type="button"
                variant="outline"
            >
                <PlusIcon className="mr-1 h-4 w-4" />
                Add Replacement
            </Button>
        </div>
    );
};
