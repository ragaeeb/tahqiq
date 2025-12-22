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
 * Parses JSON options back into RuleConfig array
 */
const parseJsonToRuleConfigs = (json: string): RuleConfig[] | null => {
    try {
        const parsed = JSON.parse(json);
        if (!parsed.rules || !Array.isArray(parsed.rules)) {
            return null;
        }

        return parsed.rules.map((rule: Record<string, unknown>) => {
            // Determine pattern type and template
            let patternType: 'lineStartsWith' | 'lineStartsAfter' = 'lineStartsAfter';
            let template = '';

            if (rule.lineStartsWith && Array.isArray(rule.lineStartsWith)) {
                patternType = 'lineStartsWith';
                template = rule.lineStartsWith[0] as string;
            } else if (rule.lineStartsAfter && Array.isArray(rule.lineStartsAfter)) {
                patternType = 'lineStartsAfter';
                template = rule.lineStartsAfter[0] as string;
            }

            const metaType = ((rule.meta as { type?: string })?.type as 'none' | 'book' | 'chapter') || 'none';

            return {
                fuzzy: Boolean(rule.fuzzy),
                metaType,
                min: rule.min as number | undefined,
                pattern: template,
                patternType,
                template,
            };
        });
    } catch {
        return null;
    }
};

/**
 * JSON tab showing generated segmentation options (editable)
 */
export const JsonTab = () => {
    const { ruleConfigs, sliceAtPunctuation, setRuleConfigs, setSliceAtPunctuation } = useSegmentationStore();

    const generatedOptions = useMemo(
        () => buildGeneratedOptions(ruleConfigs, sliceAtPunctuation),
        [ruleConfigs, sliceAtPunctuation],
    );

    // Handle user edits - parse JSON and update ruleConfigs
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const parsed = parseJsonToRuleConfigs(newValue);

        if (parsed) {
            setRuleConfigs(parsed);

            // Also sync sliceAtPunctuation from breakpoints
            try {
                const obj = JSON.parse(newValue);
                setSliceAtPunctuation(Boolean(obj.breakpoints?.length));
            } catch {
                // ignore
            }
        }
    };

    return (
        <div className="flex flex-1 flex-col space-y-4 overflow-hidden">
            <div className="flex flex-1 flex-col">
                <Label htmlFor="json-options">Segmentation Options (JSON)</Label>
                <Textarea
                    className="mt-2 min-h-0 flex-1 resize-none overflow-auto font-mono text-sm"
                    id="json-options"
                    onChange={handleChange}
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
