'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVerticalIcon, XIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RuleConfig } from '@/stores/segmentationStore/types';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

type SortableRuleCardProps = {
    id: string;
    index: number;
    rule: RuleConfig;
    exampleLines?: (string | undefined)[];
    selected?: boolean;
    onSelect?: (pattern: string, checked: boolean) => void;
};

/**
 * Individual rule card with template input, dropdowns, and drag-to-reorder handle
 */
export const SortableRuleCard = ({ id, index, rule, exampleLines, selected, onSelect }: SortableRuleCardProps) => {
    const { updateRuleConfig, togglePattern } = useSegmentationStore();
    const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = { opacity: isDragging ? 0.5 : 1, transform: CSS.Transform.toString(transform), transition };

    // Handle template display - can be string or array
    const templates = Array.isArray(rule.template) ? rule.template : [rule.template];
    const isMultiTemplate = templates.length > 1;

    const handleTemplateChange = (newValue: string | string[]) => {
        updateRuleConfig(index, { template: newValue });
    };

    return (
        <div
            className={`rounded-lg border bg-white p-3 shadow-sm ${selected ? 'ring-2 ring-blue-500' : ''}`}
            ref={setNodeRef}
            style={style}
        >
            <div className="mb-1 flex items-start gap-2">
                {/* Selection Checkbox */}
                {onSelect && (
                    <Checkbox
                        checked={selected}
                        className="mt-1"
                        onCheckedChange={(checked) => onSelect(rule.pattern, checked === true)}
                    />
                )}

                {/* Drag Handle */}
                <button
                    className="mt-1 cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing"
                    type="button"
                    {...attributes}
                    {...listeners}
                >
                    <GripVerticalIcon className="h-4 w-4" />
                </button>

                {/* Template input(s) */}
                <div className="flex-1">
                    {isMultiTemplate ? (
                        <div className="space-y-1">
                            {templates.map((t, idx) => (
                                <div className="flex items-center gap-1" key={t}>
                                    <span className="text-muted-foreground text-xs">{idx + 1}.</span>
                                    <input
                                        className="flex-1 border-none bg-transparent font-mono text-gray-700 text-sm outline-none focus:bg-gray-50 focus:ring-1 focus:ring-blue-200"
                                        onChange={(e) => {
                                            const newTemplates = [...templates];
                                            newTemplates[idx] = e.target.value;
                                            handleTemplateChange(newTemplates);
                                        }}
                                        title={`Template ${idx + 1}`}
                                        value={t}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <input
                            className="w-full border-none bg-transparent font-mono text-gray-700 text-sm outline-none focus:bg-gray-50 focus:ring-1 focus:ring-blue-200"
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            title={`Original: ${rule.pattern}`}
                            value={templates[0]}
                        />
                    )}
                </div>
            </div>
            {/* Show examples for each template */}
            <div className="mb-2 ml-12 space-y-0.5">
                {exampleLines?.filter(Boolean).map((ex) => (
                    <div className="max-w-full truncate text-muted-foreground text-xs" dir="rtl" key={ex} title={ex}>
                        {ex!.slice(0, 80)}
                        {ex!.length > 80 ? '…' : ''}
                    </div>
                ))}
            </div>
            <div className="ml-12 flex flex-wrap items-center gap-3">
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
                        onCheckedChange={(fuzzy) => updateRuleConfig(index, { fuzzy: fuzzy === true })}
                    />
                    <Label className="cursor-pointer text-xs" htmlFor={`fuzzy-${index}`}>
                        Fuzzy
                    </Label>
                </div>

                {/* Page Start Guard */}
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={rule.pageStartGuard}
                        id={`pageGuard-${index}`}
                        onCheckedChange={(checked) => updateRuleConfig(index, { pageStartGuard: checked === true })}
                    />
                    <Label className="cursor-pointer text-xs" htmlFor={`pageGuard-${index}`}>
                        Page Guard
                    </Label>
                </div>

                {/* Remove */}
                <div className="ml-auto">
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
