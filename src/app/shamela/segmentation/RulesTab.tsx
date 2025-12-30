'use client';

import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowDownWideNarrowIcon, MergeIcon, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';
import { SortableRuleCard } from './RuleCard';

/**
 * Token Mappings section component
 */
const TokenMappingsSection = () => {
    const { tokenMappings, setTokenMappings } = useSegmentationStore();

    const handleUpdateMapping = (index: number, field: 'token' | 'name', value: string) => {
        const updated = [...tokenMappings];
        updated[index] = { ...updated[index], [field]: value };
        setTokenMappings(updated);
    };

    const handleRemoveMapping = (index: number) => {
        setTokenMappings(tokenMappings.filter((_, i) => i !== index));
    };

    const handleAddMapping = () => {
        setTokenMappings([...tokenMappings, { name: '', token: '' }]);
    };

    return (
        <div className="mb-4 rounded-lg border bg-amber-50 p-3">
            <div className="mb-2 flex items-center justify-between">
                <Label className="font-medium text-amber-800 text-sm">
                    Token Mappings <span className="font-normal text-amber-600 text-xs">(apply to all rules)</span>
                </Label>
                <Button className="h-6 text-xs" onClick={handleAddMapping} size="sm" variant="outline">
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                </Button>
            </div>
            {tokenMappings.length > 0 ? (
                <div className="space-y-2">
                    {tokenMappings.map((mapping, idx) => (
                        <div className="flex items-center gap-2" key={idx}>
                            <div className="flex flex-1 items-center gap-1">
                                <span className="text-muted-foreground text-xs">{'{{'}</span>
                                <Input
                                    className="h-7 w-24 font-mono text-xs"
                                    onChange={(e) => handleUpdateMapping(idx, 'token', e.target.value)}
                                    placeholder="token"
                                    value={mapping.token}
                                />
                                <span className="text-muted-foreground text-xs">{'}}'}</span>
                            </div>
                            <span className="text-muted-foreground">→</span>
                            <div className="flex flex-1 items-center gap-1">
                                <span className="text-muted-foreground text-xs">{'{{'}</span>
                                <span className="font-mono text-muted-foreground text-xs">
                                    {mapping.token || 'token'}
                                </span>
                                <span className="text-muted-foreground text-xs">:</span>
                                <Input
                                    className="h-7 w-24 font-mono text-xs"
                                    onChange={(e) => handleUpdateMapping(idx, 'name', e.target.value)}
                                    placeholder="name"
                                    value={mapping.name}
                                />
                                <span className="text-muted-foreground text-xs">{'}}'}</span>
                            </div>
                            <Button
                                className="h-6 w-6 p-0"
                                onClick={() => handleRemoveMapping(idx)}
                                size="icon"
                                variant="ghost"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-xs">
                    No mappings defined. Add mappings to auto-apply named groups.
                </p>
            )}
        </div>
    );
};

/**
 * Rules tab content with global settings and rule cards
 */
export const RulesTab = () => {
    const {
        allLineStarts,
        allRepeatingSequences,
        mergeSelectedRules,
        moveRule,
        ruleConfigs,
        sliceAtPunctuation,
        setSliceAtPunctuation,
        sortRulesByLength,
    } = useSegmentationStore();

    const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = ruleConfigs.findIndex((r) => r.pattern === active.id);
            const newIndex = ruleConfigs.findIndex((r) => r.pattern === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                moveRule(oldIndex, newIndex);
            }
        }
    };

    const handleSelectForMerge = (pattern: string, checked: boolean) => {
        setSelectedForMerge((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(pattern);
            } else {
                next.delete(pattern);
            }
            return next;
        });
    };

    // Check if merge is possible (2+ selected, all same patternType)
    const selectedRules = ruleConfigs.filter((r) => selectedForMerge.has(r.pattern));
    const canMerge =
        selectedRules.length >= 2 && selectedRules.every((r) => r.patternType === selectedRules[0].patternType);
    const mergeDisabledReason =
        selectedRules.length < 2
            ? 'Select 2+ rules to merge'
            : !canMerge
              ? 'Cannot merge rules with different pattern types'
              : undefined;

    const handleMerge = () => {
        if (!canMerge) {
            return;
        }
        mergeSelectedRules(Array.from(selectedForMerge));
        setSelectedForMerge(new Set());
    };

    return (
        <ScrollArea className="min-h-0 flex-1">
            {/* Token Mappings */}
            <TokenMappingsSection />

            {/* Global Settings */}
            <div className="mb-4 flex items-center gap-4 rounded-lg border bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={sliceAtPunctuation}
                        id="slice-punctuation"
                        onCheckedChange={(checked) => setSliceAtPunctuation(checked === true)}
                    />
                    <Label className="cursor-pointer" htmlFor="slice-punctuation">
                        Slice at Last Punctuation (breakpoints)
                    </Label>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {selectedForMerge.size > 0 && (
                        <Button
                            className="h-8 text-xs"
                            disabled={!canMerge}
                            onClick={handleMerge}
                            size="sm"
                            title={mergeDisabledReason}
                            variant="default"
                        >
                            <MergeIcon className="mr-1 h-4 w-4" />
                            Merge ({selectedForMerge.size})
                        </Button>
                    )}
                    {ruleConfigs.length > 1 && (
                        <Button
                            className="h-8 text-xs"
                            onClick={sortRulesByLength}
                            size="sm"
                            title="Sort by length (longest first) - matches most specific rules first"
                            variant="outline"
                        >
                            <ArrowDownWideNarrowIcon className="mr-1 h-4 w-4" />
                            Sort by Length
                        </Button>
                    )}
                </div>
            </div>

            {ruleConfigs.length > 0 ? (
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
                    <SortableContext items={ruleConfigs.map((r) => r.pattern)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {ruleConfigs.map((rule, idx) => {
                                // Collect examples for each template in the rule
                                const templates = Array.isArray(rule.template) ? rule.template : [rule.template];
                                const exampleLines = templates.map((t) => {
                                    if (rule.patternType === 'template') {
                                        const patternData = allRepeatingSequences.find((p) => p.pattern === t);
                                        return patternData?.examples?.[0]?.text;
                                    }
                                    // Find example for this template - check if any pattern data matches
                                    const patternData = allLineStarts.find((p) => p.pattern === t);
                                    return patternData?.examples?.[0]?.line;
                                });

                                return (
                                    <SortableRuleCard
                                        exampleLines={exampleLines}
                                        id={rule.pattern}
                                        index={idx}
                                        key={rule.pattern}
                                        onSelect={handleSelectForMerge}
                                        rule={rule}
                                        selected={selectedForMerge.has(rule.pattern)}
                                    />
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                    Select patterns in the Patterns tab to create rules
                </div>
            )}
        </ScrollArea>
    );
};
