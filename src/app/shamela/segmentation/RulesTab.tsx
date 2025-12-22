'use client';

import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';
import { RuleCard } from './RuleCard';

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
    const { allLineStarts, ruleConfigs, sliceAtPunctuation, setSliceAtPunctuation } = useSegmentationStore();

    return (
        <ScrollArea className="min-h-0 flex-1">
            {/* Token Mappings */}
            <TokenMappingsSection />

            {/* Global Settings */}
            <div className="mb-4 flex items-center gap-2 rounded-lg border bg-gray-50 p-3">
                <Checkbox
                    checked={sliceAtPunctuation}
                    id="slice-punctuation"
                    onCheckedChange={(checked) => setSliceAtPunctuation(checked === true)}
                />
                <Label className="cursor-pointer" htmlFor="slice-punctuation">
                    Slice at Last Punctuation (breakpoints)
                </Label>
            </div>

            {ruleConfigs.length > 0 ? (
                <div className="space-y-3">
                    {ruleConfigs.map((rule, idx) => {
                        const patternData = allLineStarts.find((p) => p.pattern === rule.pattern);
                        const exampleLine = patternData?.examples?.[0]?.line;

                        return (
                            <RuleCard
                                exampleLine={exampleLine}
                                index={idx}
                                isFirst={idx === 0}
                                isLast={idx === ruleConfigs.length - 1}
                                key={rule.pattern}
                                rule={rule}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                    Select patterns in the Patterns tab to create rules
                </div>
            )}
        </ScrollArea>
    );
};
