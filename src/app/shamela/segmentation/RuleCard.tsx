'use client';

import { ChevronDownIcon, ChevronUpIcon, XIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RuleConfig } from '@/stores/segmentationStore/types';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type RuleCardProps = { index: number; rule: RuleConfig; exampleLine?: string; isFirst: boolean; isLast: boolean };

/**
 * Individual rule card with template input, dropdowns, and reorder buttons
 */
export const RuleCard = ({ index, rule, exampleLine, isFirst, isLast }: RuleCardProps) => {
    const { updateRuleConfig, moveRule, togglePattern } = useSegmentationStore();

    return (
        <div className="rounded-lg border bg-white p-3 shadow-sm">
            <input
                className="mb-1 w-full border-none bg-transparent font-mono text-gray-700 text-sm outline-none focus:bg-gray-50 focus:ring-1 focus:ring-blue-200"
                onChange={(e) => updateRuleConfig(index, { template: e.target.value })}
                title={`Original: ${rule.pattern}`}
                value={rule.template}
            />
            {exampleLine && (
                <div className="mb-2 max-w-full truncate text-muted-foreground text-xs" dir="rtl" title={exampleLine}>
                    {exampleLine.slice(0, 80)}
                    {exampleLine.length > 80 ? '…' : ''}
                </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
                {/* Pattern Type */}
                <div className="flex items-center gap-2">
                    <Label className="text-gray-500 text-xs">Type:</Label>
                    <Select
                        onValueChange={(value: 'lineStartsWith' | 'lineStartsAfter') =>
                            updateRuleConfig(index, { patternType: value })
                        }
                        value={rule.patternType}
                    >
                        <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lineStartsAfter">lineStartsAfter</SelectItem>
                            <SelectItem value="lineStartsWith">lineStartsWith</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Meta Type */}
                <div className="flex items-center gap-2">
                    <Label className="text-gray-500 text-xs">Meta:</Label>
                    <Select
                        onValueChange={(value: 'none' | 'book' | 'chapter') =>
                            updateRuleConfig(index, { metaType: value })
                        }
                        value={rule.metaType}
                    >
                        <SelectTrigger className="h-8 w-24 text-xs">
                            <SelectValue placeholder="none" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">none</SelectItem>
                            <SelectItem value="chapter">chapter</SelectItem>
                            <SelectItem value="book">book</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Min Page */}
                <div className="flex items-center gap-2">
                    <Label className="text-gray-500 text-xs">Min:</Label>
                    <input
                        className="h-8 w-16 rounded border px-2 text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        min={1}
                        onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            updateRuleConfig(index, { min: value });
                        }}
                        placeholder="-"
                        type="number"
                        value={rule.min ?? ''}
                    />
                </div>

                {/* Fuzzy */}
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={rule.fuzzy}
                        id={`fuzzy-${index}`}
                        onCheckedChange={(fuzzy) => updateRuleConfig(index, { fuzzy })}
                    />
                    <Label className="cursor-pointer text-xs" htmlFor={`fuzzy-${index}`}>
                        Fuzzy
                    </Label>
                </div>

                {/* Reorder */}
                <div className="ml-auto flex items-center gap-1">
                    <button
                        className="text-gray-400 hover:text-blue-500 disabled:opacity-30"
                        disabled={isFirst}
                        onClick={() => moveRule(index, index - 1)}
                        title="Move up"
                        type="button"
                    >
                        <ChevronUpIcon className="h-4 w-4" />
                    </button>
                    <button
                        className="text-gray-400 hover:text-blue-500 disabled:opacity-30"
                        disabled={isLast}
                        onClick={() => moveRule(index, index + 1)}
                        title="Move down"
                        type="button"
                    >
                        <ChevronDownIcon className="h-4 w-4" />
                    </button>

                    {/* Remove */}
                    <button
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => togglePattern(rule.pattern)}
                        title="Remove rule"
                        type="button"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
