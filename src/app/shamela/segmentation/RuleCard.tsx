'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Page, type Segment, type SegmentationOptions, segmentPages } from 'flappa-doormal';
import { GripVerticalIcon, XIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RuleConfig, TokenMapping } from '@/stores/segmentationStore/types';
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
 * Apply token mappings to a template string (copied from JsonTab to avoid circular deps)
 */
const applyTokenMappings = (template: string, mappings: TokenMapping[]): string => {
    let result = template;
    for (const { token, name } of mappings) {
        const regex = new RegExp(`\\{\\{${token}\\}\\}`, 'g');
        result = result.replace(regex, `{{${token}:${name}}}`);
    }
    return result;
};

/**
 * Run segmentation on example lines using the rule's configuration
 */
const segmentExamples = (
    exampleLines: (string | undefined)[],
    rule: RuleConfig,
    tokenMappings: TokenMapping[],
): (Segment | null)[] => {
    const templates = Array.isArray(rule.template) ? rule.template : [rule.template];
    const transformedTemplates = templates.map((t) => applyTokenMappings(t, tokenMappings));

    const ruleObj = {
        [rule.patternType]: transformedTemplates,
        ...(rule.fuzzy && { fuzzy: true }),
        ...(rule.metaType !== 'none' && { meta: { type: rule.metaType } }),
    };

    // Cast to bypass TypeScript inference issue with dynamic patternType key
    const options = { rules: [ruleObj] } as unknown as SegmentationOptions;

    return exampleLines.map((ex, idx) => {
        if (!ex) {
            return null;
        }
        try {
            const pages: Page[] = [{ content: ex, id: idx + 1 }];
            const segments = segmentPages(pages, options);
            // Return the first segment that has content (not the whole page)
            return segments.length > 0 ? segments[0] : null;
        } catch {
            return null;
        }
    });
};

/**
 * Individual rule card with template input, dropdowns, and drag-to-reorder handle
 */
export const SortableRuleCard = ({ id, index, rule, exampleLines, selected, onSelect }: SortableRuleCardProps) => {
    const { updateRuleConfig, togglePattern, tokenMappings } = useSegmentationStore();
    const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = { opacity: isDragging ? 0.5 : 1, transform: CSS.Transform.toString(transform), transition };

    // Handle template display - can be string or array
    const templates = Array.isArray(rule.template) ? rule.template : [rule.template];
    const isMultiTemplate = templates.length > 1;

    const handleTemplateChange = (newValue: string | string[]) => {
        updateRuleConfig(index, { template: newValue });
    };

    // Segment examples to show preview
    const segmentedExamples = useMemo(() => {
        if (!exampleLines || exampleLines.length === 0) {
            return [];
        }
        return segmentExamples(exampleLines, rule, tokenMappings);
    }, [exampleLines, rule, tokenMappings]);

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
                                <div className="flex items-center gap-1" key={`${idx}-${t}`}>
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

            {/* Examples with segmentation preview - table layout */}
            {exampleLines?.some(Boolean) && (
                <div className="mb-2 ml-12 overflow-hidden rounded-md border border-gray-200">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border-gray-200 border-r px-3 py-1.5 text-left font-medium text-gray-600">
                                    Example
                                </th>
                                <th className="px-3 py-1.5 text-left font-medium text-gray-600">Segment Result</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {exampleLines.map((ex, idx) => {
                                if (!ex) {
                                    return null;
                                }
                                const segment = segmentedExamples[idx];
                                const segmentDisplay = segment
                                    ? JSON.stringify({ content: segment.content?.slice(0, 40), meta: segment.meta })
                                    : '—';

                                return (
                                    <tr className="border-gray-100 border-t" key={ex}>
                                        <td
                                            className="max-w-[200px] truncate border-gray-200 border-r px-3 py-1.5 text-gray-700"
                                            dir="rtl"
                                            title={ex}
                                        >
                                            {ex.slice(0, 50)}
                                            {ex.length > 50 ? '…' : ''}
                                        </td>
                                        <td
                                            className="max-w-[300px] truncate px-3 py-1.5 font-mono text-[10px] text-gray-500"
                                            title={segmentDisplay}
                                        >
                                            {segmentDisplay}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="ml-12 flex flex-wrap items-center gap-3">
                {/* Pattern Type */}
                <div className="flex items-center gap-2">
                    <Label className="text-gray-500 text-xs">Type:</Label>
                    <Select
                        onValueChange={(value: 'lineStartsWith' | 'lineStartsAfter' | 'template') =>
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
                            <SelectItem value="template">template</SelectItem>
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
