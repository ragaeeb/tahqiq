'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';
import { RuleCard } from './RuleCard';

/**
 * Rules tab content with global settings and rule cards
 */
export const RulesTab = () => {
    const { allLineStarts, ruleConfigs, sliceAtPunctuation, setSliceAtPunctuation } = useSegmentationStore();

    return (
        <ScrollArea className="min-h-0 flex-1">
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
