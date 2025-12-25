'use client';

import { type SplitRule, validateRules } from 'flappa-doormal';
import { AlertCircleIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

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
 * Formats validation issues into readable error messages.
 * Takes the raw result from validateRules and extracts human-readable messages.
 */
const formatValidationIssues = (results: ReturnType<typeof validateRules>): string[] => {
    const errors: string[] = [];

    results.forEach((result, ruleIndex) => {
        if (!result) {
            return;
        }

        // Each result is a Record with pattern types as keys (lineStartsWith, lineStartsAfter, etc.)
        // and arrays of ValidationIssue as values
        for (const [patternType, issues] of Object.entries(result)) {
            if (!issues || !Array.isArray(issues)) {
                continue;
            }

            for (const issue of issues) {
                if (!issue) {
                    continue;
                }
                const location = `Rule ${ruleIndex + 1}, ${patternType}`;

                // Handle different issue types with proper type checking
                const issueType = issue.type as string;
                if (issueType === 'missing_braces' && 'token' in issue) {
                    errors.push(`${location}: Missing {{}} around token "${issue.token}"`);
                } else if (issueType === 'unknown_token' && 'token' in issue) {
                    errors.push(`${location}: Unknown token "{{${issue.token}}}"`);
                } else if (issueType === 'duplicate' && 'pattern' in issue) {
                    errors.push(`${location}: Duplicate pattern "${issue.pattern}"`);
                } else if (issue.message) {
                    errors.push(`${location}: ${issue.message}`);
                } else {
                    errors.push(`${location}: ${issueType}`);
                }
            }
        }
    });

    return errors;
};

/**
 * JSON tab showing generated segmentation options.
 * Editable textarea that syncs changes back to store on blur.
 * This allows users to paste existing JSON configurations.
 * Validates rules using flappa-doormal's validateRules function.
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

    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Generate initial value from current state
    const initialValue = buildGeneratedOptions(ruleConfigs, sliceAtPunctuation, tokenMappings, replacements);

    // Validate rules from current store state
    const storeValidationErrors = useMemo(() => {
        try {
            const parsed = JSON.parse(initialValue);
            if (parsed?.rules && Array.isArray(parsed.rules)) {
                const issues = validateRules(parsed.rules as SplitRule[]);
                // Filter out undefined/null results and empty issue objects
                const nonEmptyResults = issues.filter(
                    (result): result is NonNullable<typeof result> => result != null && Object.keys(result).length > 0,
                );
                return formatValidationIssues(nonEmptyResults);
            }
        } catch {
            // Invalid JSON, will be caught elsewhere
        }
        return [];
    }, [initialValue]);

    // Combine store validation errors with textarea validation errors
    const allErrors = validationErrors.length > 0 ? validationErrors : storeValidationErrors;

    const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
        const value = event.target.value;

        // First try to parse JSON
        let parsed: { rules?: unknown[] } | undefined;
        try {
            parsed = JSON.parse(value) as { rules?: unknown[] };
        } catch {
            setValidationErrors(['Invalid JSON syntax']);
            return;
        }

        // Validate rules if present
        if (parsed?.rules && Array.isArray(parsed.rules)) {
            const issues = validateRules(parsed.rules as SplitRule[]);
            // Filter out undefined/null results and empty issue objects
            const nonEmptyResults = issues.filter(
                (result): result is NonNullable<typeof result> => result != null && Object.keys(result).length > 0,
            );
            const errors = formatValidationIssues(nonEmptyResults);
            setValidationErrors(errors);
        } else {
            setValidationErrors([]);
        }

        // Parse and sync to store
        const parsedOptions = parseJsonOptions(value);
        if (parsedOptions) {
            setRuleConfigs(parsedOptions.ruleConfigs);
            setSliceAtPunctuation(parsedOptions.sliceAtPunctuation);
            setReplacements(parsedOptions.replacements);
            // Sync selectedPatterns from all templates in parsed rules (flatten arrays)
            // Strip token mappings so {{raqms:num}} becomes {{raqms}} to match allLineStarts
            const patterns = new Set<string>();
            for (const r of parsedOptions.ruleConfigs) {
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
                {allErrors.length > 0 && (
                    <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3">
                        <div className="flex items-start gap-2">
                            <AlertCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                            <div className="flex-1">
                                <p className="font-medium text-red-800 text-sm">Rule Validation Errors</p>
                                <ul className="mt-1 list-inside list-disc space-y-0.5 text-red-700 text-xs">
                                    {allErrors.map((error) => (
                                        <li key={error}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
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
