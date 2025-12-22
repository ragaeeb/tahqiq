'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RuleConfig } from '@/stores/segmentationStore/types';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

/**
 * Builds the segmentation options object from rule configs
 */
export const buildGeneratedOptions = (ruleConfigs: RuleConfig[], sliceAtPunctuation: boolean): string => {
    const options: Record<string, unknown> = {
        maxPages: 1,
        rules: ruleConfigs.map((r) => ({
            [r.patternType]: [r.template],
            ...(r.fuzzy && { fuzzy: true }),
            ...(r.metaType !== 'none' && { meta: { type: r.metaType } }),
            ...(r.min && { min: r.min }),
        })),
    };

    if (sliceAtPunctuation) {
        options.breakpoints = [{ pattern: '{{tarqim}}\\s*' }, ''];
    }

    return JSON.stringify(options, null, 4);
};

/**
 * JSON tab showing generated segmentation options
 */
export const JsonTab = () => {
    const { ruleConfigs, sliceAtPunctuation } = useSegmentationStore();

    const generatedOptions = useMemo(
        () => buildGeneratedOptions(ruleConfigs, sliceAtPunctuation),
        [ruleConfigs, sliceAtPunctuation],
    );

    return (
        <div className="flex flex-1 flex-col space-y-4 overflow-hidden">
            <div className="flex flex-1 flex-col">
                <Label htmlFor="json-options">Segmentation Options (JSON)</Label>
                <Textarea
                    className="mt-2 min-h-0 flex-1 resize-none overflow-auto font-mono text-sm"
                    id="json-options"
                    value={generatedOptions}
                />
            </div>
        </div>
    );
};

/**
 * Hook to get generated options JSON for external use
 */
export const useGeneratedOptions = () => {
    const { ruleConfigs, sliceAtPunctuation } = useSegmentationStore();

    return useMemo(() => buildGeneratedOptions(ruleConfigs, sliceAtPunctuation), [ruleConfigs, sliceAtPunctuation]);
};
