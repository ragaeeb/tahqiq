'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RuleConfig, TokenMapping } from '@/stores/segmentationStore/types';
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
        // Regex: \{\{token\}\} but not \{\{token:[^}]+\}\}
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
): string => {
    const options: Record<string, unknown> = {
        maxPages: 1,
        rules: ruleConfigs.map((r) => {
            // Handle both string and string[] templates
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
                pageStartGuard: Boolean(rule.pageStartGuard),
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
    const { ruleConfigs, sliceAtPunctuation, tokenMappings, setRuleConfigs, setSliceAtPunctuation } =
        useSegmentationStore();

    const generatedOptions = useMemo(
        () => buildGeneratedOptions(ruleConfigs, sliceAtPunctuation, tokenMappings),
        [ruleConfigs, sliceAtPunctuation, tokenMappings],
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
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col">
                <Label htmlFor="json-options">Segmentation Options (JSON)</Label>
                <Textarea
                    className="mt-2 h-full min-h-0 flex-1 resize-none overflow-y-auto font-mono text-sm"
                    id="json-options"
                    onChange={handleChange}
                    style={{ fieldSizing: 'fixed' }}
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
    const { ruleConfigs, sliceAtPunctuation, tokenMappings } = useSegmentationStore();

    return useMemo(
        () => buildGeneratedOptions(ruleConfigs, sliceAtPunctuation, tokenMappings),
        [ruleConfigs, sliceAtPunctuation, tokenMappings],
    );
};
