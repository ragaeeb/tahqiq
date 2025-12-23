'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Replacement, RuleConfig, TokenMapping } from '@/stores/segmentationStore/types';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

/**
 * Apply token mappings to a template string.
 * Transforms {{token}} to {{token:name}} based on mappings.
 * Tokens that already have a name ({{token:existing}}) are left unchanged.
 */
const applyTokenMappings = (template: string, mappings: TokenMapping[]): string => {
    let result = template;
    for (const { token, name } of mappings) {
        // Match {{token}} but not {{token:something}}
        const regex = new RegExp(`\\{\\{${token}\\}\\}`, 'g');
        result = result.replace(regex, `{{${token}:${name}}}`);
    }
    return result;
};

/**
 * Builds the segmentation options object from rule configs
 */
export const buildGeneratedOptions = (
    ruleConfigs: RuleConfig[],
    sliceAtPunctuation: boolean,
    tokenMappings: TokenMapping[] = [],
    replacements: Replacement[] = [],
): string => {
    const options: Record<string, unknown> = {
        maxPages: 1,
        rules: ruleConfigs.map((r) => {
            const templates = Array.isArray(r.template) ? r.template : [r.template];
            const transformedTemplates = templates.map((t) => applyTokenMappings(t, tokenMappings));
            return {
                [r.patternType]: transformedTemplates,
                ...(r.fuzzy && { fuzzy: true }),
                ...(r.pageStartGuard && { pageStartGuard: '{{tarqim}}' }),
                ...(r.metaType !== 'none' && { meta: { type: r.metaType } }),
                ...(r.min && { min: r.min }),
            };
        }),
    };

    if (sliceAtPunctuation) {
        options.breakpoints = [{ pattern: '{{tarqim}}\\s*' }, ''];
    }

    const validReplacements = replacements.filter((r) => r.regex.trim() !== '');
    if (validReplacements.length > 0) {
        options.replace = validReplacements;
    }

    return JSON.stringify(options, null, 4);
};

/**
 * JSON tab showing generated segmentation options.
 * Uncontrolled textarea - initializes with generated JSON but edits don't sync back.
 * This is the final step before segmentation, allowing manual JSON tweaks.
 */
export const JsonTab = () => {
    const { ruleConfigs, replacements, sliceAtPunctuation, tokenMappings } = useSegmentationStore();

    // Generate initial value from current state
    const initialValue = buildGeneratedOptions(ruleConfigs, sliceAtPunctuation, tokenMappings, replacements);

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col">
                <Label htmlFor="json-options">Segmentation Options (JSON)</Label>
                <p className="mb-2 text-muted-foreground text-xs">
                    Edit the raw JSON options. Changes here won't sync back to other tabs.
                </p>
                <Textarea
                    className="h-full min-h-0 flex-1 resize-none overflow-y-auto font-mono text-sm"
                    defaultValue={initialValue}
                    id="json-options"
                    style={{ fieldSizing: 'fixed' }}
                />
            </div>
        </div>
    );
};

/**
 * Hook to get the current JSON from the textarea (for finalization).
 * Returns a function that reads the textarea value directly.
 */
export const useJsonTextareaValue = () => {
    return () => {
        const textarea = document.getElementById('json-options') as HTMLTextAreaElement | null;
        return textarea?.value ?? '';
    };
};
