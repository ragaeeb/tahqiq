'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { parseJsonOptions } from '@/lib/segmentation';
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
 * Strip token mappings from a template string.
 * Transforms {{token:name}} back to {{token}}.
 * This is the reverse of applyTokenMappings.
 */
const stripTokenMappings = (template: string): string => {
    // Match {{token:name}} and replace with {{token}}
    return template.replace(/\{\{([^:}]+):[^}]+\}\}/g, '{{$1}}');
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
            // Use full meta object if present, otherwise generate from metaType
            const meta = r.meta ?? (r.metaType !== 'none' ? { type: r.metaType } : undefined);
            return {
                [r.patternType]: transformedTemplates,
                ...(r.fuzzy && { fuzzy: true }),
                ...(r.pageStartGuard && { pageStartGuard: '{{tarqim}}' }),
                ...(meta && { meta }),
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
 * Editable textarea that syncs changes back to store on blur.
 * This allows users to paste existing JSON configurations.
 */
export const JsonTab = () => {
    const {
        ruleConfigs,
        replacements,
        sliceAtPunctuation,
        tokenMappings,
        setRuleConfigs,
        setSliceAtPunctuation,
        setReplacements,
    } = useSegmentationStore();

    // Generate initial value from current state
    const initialValue = buildGeneratedOptions(ruleConfigs, sliceAtPunctuation, tokenMappings, replacements);

    const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
        const parsed = parseJsonOptions(event.target.value);
        if (parsed) {
            setRuleConfigs(parsed.ruleConfigs);
            setSliceAtPunctuation(parsed.sliceAtPunctuation);
            setReplacements(parsed.replacements);
            // Sync selectedPatterns from all templates in parsed rules (flatten arrays)
            // Strip token mappings so {{raqms:num}} becomes {{raqms}} to match allLineStarts
            const patterns = new Set<string>();
            for (const r of parsed.ruleConfigs) {
                if (Array.isArray(r.template)) {
                    for (const t of r.template) {
                        patterns.add(stripTokenMappings(t));
                    }
                } else {
                    patterns.add(stripTokenMappings(r.template));
                }
            }
            useSegmentationStore.setState({ selectedPatterns: patterns });
        }
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col">
                <Label htmlFor="json-options">Segmentation Options (JSON)</Label>
                <p className="mb-2 text-muted-foreground text-xs">
                    Paste or edit JSON options. Changes sync to other tabs on blur.
                </p>
                <Textarea
                    className="h-full min-h-0 flex-1 resize-none overflow-y-auto font-mono text-sm"
                    defaultValue={initialValue}
                    id="json-options"
                    onBlur={handleBlur}
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
