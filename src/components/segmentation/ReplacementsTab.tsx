'use client';

import type { SegmentationOptions } from 'flappa-doormal';
import { PlusIcon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type OptReplacement = NonNullable<SegmentationOptions['replace']>[number];

type ReplacementRowProps = {
    index: number;
    replacement: OptReplacement;
    onChange: (index: number, patch: Partial<OptReplacement>) => void;
    onDelete: (index: number) => void;
};

const ReplacementRow = ({ index, replacement, onChange, onDelete }: ReplacementRowProps) => {
    const isRegexEmpty = replacement.regex.trim().length === 0;
    return (
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
    );
};

export const ReplacementsTab = () => {
    const replacements = useSegmentationStore((s) => s.options.replace);
    const updateOptions = useSegmentationStore((s) => s.updateOptions);

    const handleChange = (index: number, patch: Partial<OptReplacement>) => {
        const next = [...replacements];
        next[index] = { ...next[index], ...patch };
        updateOptions({ replace: next });
    };

    const handleDelete = (index: number) => {
        updateOptions({ replace: replacements.filter((_, i) => i !== index) });
    };

    return (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-3">
            <div className="space-y-1">
                <Label>Pre-processing Replacements</Label>
                <p className="text-muted-foreground text-sm">
                    Applied to page content before segmentation. These are raw regex patterns (no token expansion).
                </p>
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
                onClick={() => updateOptions({ replace: [...replacements, { regex: '', replacement: '' }] })}
                type="button"
                variant="outline"
            >
                <PlusIcon className="mr-1 h-4 w-4" />
                Add Replacement
            </Button>
        </div>
    );
};
