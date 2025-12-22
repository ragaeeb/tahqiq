'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

/**
 * JSON tab showing generated segmentation options
 */
export const JsonTab = () => {
    const { ruleConfigs, sliceAtPunctuation } = useSegmentationStore();

    const generatedOptions = useMemo(() => {
        const options: Record<string, unknown> = {
            maxPages: 1,
            rules: ruleConfigs.map((r) => ({
                [r.patternType]: [r.template],
                ...(r.fuzzy && { fuzzy: true }),
                ...(r.metaType !== 'none' && { meta: { type: r.metaType } }),
                ...(r.min && { min: r.min }),
                split: 'at',
            })),
        };

        if (sliceAtPunctuation) {
            options.breakpoints = [{ pattern: '{{tarqim}}\\s*' }, ''];
        }

        return JSON.stringify(options, null, 4);
    }, [ruleConfigs, sliceAtPunctuation]);

    return (
        <div className="flex flex-1 flex-col space-y-4 overflow-hidden">
            <div className="flex flex-1 flex-col">
                <Label htmlFor="json-options">Segmentation Options (JSON)</Label>
                <Textarea
                    className="mt-2 flex-1 font-mono text-sm"
                    id="json-options"
                    readOnly
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

    return useMemo(() => {
        const options: Record<string, unknown> = {
            maxPages: 1,
            rules: ruleConfigs.map((r) => ({
                [r.patternType]: [r.template],
                ...(r.fuzzy && { fuzzy: true }),
                ...(r.metaType !== 'none' && { meta: { type: r.metaType } }),
                ...(r.min && { min: r.min }),
                split: 'at',
            })),
        };

        if (sliceAtPunctuation) {
            options.breakpoints = [{ pattern: '{{tarqim}}\\s*' }, ''];
        }

        return JSON.stringify(options, null, 4);
    }, [ruleConfigs, sliceAtPunctuation]);
};
