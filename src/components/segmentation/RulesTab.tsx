'use client';

import type { PatternTypeKey, SplitRule, TokenMapping } from 'flappa-doormal';
import { optimizeRules, PATTERN_TYPE_KEYS, Token } from 'flappa-doormal';
import { Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { applyTokenMappingsToRule, getPatternKey, getPatternValueString, SUGGESTED_RULES } from '@/lib/rules';
import { splitLines } from '@/lib/textUtils';
import { DEFAULT_TOKEN_MAPPINGS } from '@/stores/segmentationStore/types';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

const TokenMappingsSection = () => {
    const tokenMappings = useSegmentationStore((s) => s.tokenMappings);
    const setTokenMappings = useSegmentationStore((s) => s.setTokenMappings);

    const update = (index: number, patch: Partial<TokenMapping>) => {
        const next = [...tokenMappings];
        next[index] = { ...next[index], ...patch };
        setTokenMappings(next);
    };

    return (
        <div className="rounded-md border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
                <div className="text-muted-foreground text-xs">Named groups (token mappings)</div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setTokenMappings([...tokenMappings, { name: '', token: '' }])}
                        size="sm"
                        type="button"
                        variant="outline"
                    >
                        Add
                    </Button>
                    <Button
                        onClick={() => setTokenMappings(DEFAULT_TOKEN_MAPPINGS)}
                        size="sm"
                        type="button"
                        variant="outline"
                    >
                        Reset
                    </Button>
                </div>
            </div>

            {tokenMappings.length === 0 ? (
                <div className="text-muted-foreground text-xs italic">No mappings.</div>
            ) : (
                <div className="flex flex-col gap-2">
                    {tokenMappings.map((m, idx) => (
                        <div className="grid grid-cols-2 gap-2" key={`${m.token}:${m.name}:${idx}`}>
                            <Input
                                className="h-8 font-mono text-xs"
                                defaultValue={m.token}
                                onBlur={(e) => update(idx, { token: e.target.value })}
                                placeholder="token (e.g. raqms)"
                            />
                            <div className="flex gap-2">
                                <Input
                                    className="h-8 flex-1 font-mono text-xs"
                                    defaultValue={m.name}
                                    onBlur={(e) => update(idx, { name: e.target.value })}
                                    placeholder="name (e.g. num)"
                                />
                                <Button
                                    onClick={() => setTokenMappings(tokenMappings.filter((_, i) => i !== idx))}
                                    size="icon"
                                    type="button"
                                    variant="ghost"
                                >
                                    <Trash2Icon className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

type RuleRowProps = {
    index: number;
    rule: SplitRule;
    onDelete: (index: number) => void;
    onSetPatternKey: (index: number, key: PatternTypeKey) => void;
    onSetPatternValue: (index: number, key: PatternTypeKey, value: string) => void;
    onPatch: (index: number, patch: Partial<SplitRule>) => void;
};

const RuleRow = ({ index, rule, onDelete, onSetPatternKey, onSetPatternValue, onPatch }: RuleRowProps) => {
    const patternKey = getPatternKey(rule);
    const { split = 'at', occurrence = 'all', fuzzy = false, min, max, meta, pageStartGuard } = rule;

    const patternValue = getPatternValueString(rule, patternKey);
    const isPatternEmpty = patternValue.trim().length === 0;

    return (
        <div className="space-y-2 rounded-md border bg-white p-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Label className="text-muted-foreground text-xs">Rule {index + 1}</Label>
                    <Select onValueChange={(v) => onSetPatternKey(index, v as PatternTypeKey)} value={patternKey}>
                        <SelectTrigger size="sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PATTERN_TYPE_KEYS.map((k) => (
                                <SelectItem key={k} value={k}>
                                    {k}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => onDelete(index)} size="icon" type="button" variant="ghost">
                    <Trash2Icon className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>

            {patternKey === 'template' || patternKey === 'regex' ? (
                <Input
                    className={`font-mono text-sm ${isPatternEmpty ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    defaultValue={patternValue}
                    onBlur={(e) => onSetPatternValue(index, patternKey, e.target.value)}
                    placeholder={
                        patternKey === 'regex' ? 'Raw regex (no token expansion)' : 'Template (tokens supported)'
                    }
                />
            ) : (
                <Textarea
                    className={`min-h-[72px] resize-none font-mono text-sm ${isPatternEmpty ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    defaultValue={patternValue}
                    onBlur={(e) => onSetPatternValue(index, patternKey, e.target.value)}
                    placeholder={'One pattern per line'}
                    style={{ fieldSizing: 'fixed' }}
                />
            )}

            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={fuzzy}
                        onCheckedChange={(c) => onPatch(index, { fuzzy: c ? true : undefined })}
                    />
                    <Label className="text-xs">fuzzy</Label>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={Boolean(pageStartGuard)}
                        onCheckedChange={(c) => onPatch(index, { pageStartGuard: c ? Token.TARQIM : undefined })}
                    />
                    <Label className="text-xs">pageStartGuard</Label>
                </div>

                <Select onValueChange={(v) => onPatch(index, { split: v as 'at' | 'after' })} value={split}>
                    <SelectTrigger size="sm" className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="at">split: at</SelectItem>
                        <SelectItem value="after">split: after</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    onValueChange={(v) => onPatch(index, { occurrence: v as 'all' | 'first' | 'last' })}
                    value={occurrence}
                >
                    <SelectTrigger size="sm" className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">occurrence: all</SelectItem>
                        <SelectItem value="first">occurrence: first</SelectItem>
                        <SelectItem value="last">occurrence: last</SelectItem>
                    </SelectContent>
                </Select>

                <Input
                    defaultValue={min ?? ''}
                    onBlur={(e) => {
                        const v = e.target.value.trim();
                        onPatch(index, { min: v ? Number.parseInt(v, 10) : undefined });
                    }}
                    placeholder="min"
                    type="number"
                />
                <Input
                    defaultValue={max ?? ''}
                    onBlur={(e) => {
                        const v = e.target.value.trim();
                        onPatch(index, { max: v ? Number.parseInt(v, 10) : undefined });
                    }}
                    placeholder="max"
                    type="number"
                />
            </div>

            <Textarea
                className="min-h-[64px] resize-none font-mono text-xs"
                defaultValue={meta ? JSON.stringify(meta, null, 2) : ''}
                onBlur={(e) => {
                    const raw = e.target.value.trim();
                    if (!raw) {
                        onPatch(index, { meta: undefined });
                        return;
                    }
                    try {
                        onPatch(index, { meta: JSON.parse(raw) as Record<string, unknown> });
                    } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Invalid meta JSON');
                    }
                }}
                placeholder="meta (JSON object)"
                style={{ fieldSizing: 'fixed' }}
            />
        </div>
    );
};

export const RulesTab = () => {
    const rules = useSegmentationStore((s) => s.options.rules);
    const updateOptions = useSegmentationStore((s) => s.updateOptions);
    const tokenMappings = useSegmentationStore((s) => s.tokenMappings);

    const setRules = (next: SplitRule[]) => updateOptions({ rules: next });

    const addRule = () => setRules([...rules, { lineStartsWith: [''] }]);
    const addSuggestedRule = (ruleToAdd: SplitRule, label: string) => {
        setRules([...rules, ruleToAdd]);
        toast.success(`Added: ${label}`);
    };

    const patchRule = (index: number, patch: Partial<SplitRule>) => {
        const next = [...rules];
        next[index] = { ...next[index], ...patch };
        setRules(next);
    };

    const setPatternKey = (index: number, key: PatternTypeKey) => {
        const rule = rules[index];
        const currentKey = getPatternKey(rule);
        const currentValue = getPatternValueString(rule, currentKey);
        const { lineStartsWith, lineStartsAfter, lineEndsWith, template, regex, ...rest } = rule as any;
        const value = key === 'template' || key === 'regex' ? currentValue : splitLines(currentValue);
        const next = { ...rest, [key]: value } as SplitRule;
        const nextRules = [...rules];
        nextRules[index] = next;
        setRules(nextRules);
    };

    const setPatternValue = (index: number, key: PatternTypeKey, value: string) => {
        const rule = rules[index];
        const { lineStartsWith, lineStartsAfter, lineEndsWith, template, regex, ...rest } = rule as any;
        const next =
            key === 'template' || key === 'regex'
                ? ({ ...rest, [key]: value } as SplitRule)
                : ({ ...rest, [key]: splitLines(value) } as SplitRule);
        const nextRules = [...rules];
        nextRules[index] = next;
        setRules(nextRules);
    };

    const deleteRule = (index: number) => setRules(rules.filter((_, i) => i !== index));
    const optimize = () => {
        const { mergedCount, rules: mergedRules } = optimizeRules(rules);
        setRules(mergedRules);
        toast.success(
            mergedCount > 0
                ? `Optimized rules: ${rules.length} → ${mergedRules.length} (merged ${mergedCount})`
                : `Optimized rules: ${rules.length} → ${mergedRules.length}`,
        );
    };
    const applyMappings = () => {
        const next = rules.map((r) => applyTokenMappingsToRule(r, tokenMappings));
        const changed = JSON.stringify(next) !== JSON.stringify(rules);
        if (!changed) {
            toast.info('No changes');
            return;
        }
        setRules(next);
        toast.success('Applied mappings');
    };

    return (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
            <div className="flex items-center justify-between">
                <Label>Rules</Label>
                <div className="flex items-center gap-2">
                    <Button onClick={optimize} size="sm" type="button" variant="outline">
                        Optimize
                    </Button>
                    <Button onClick={applyMappings} size="sm" type="button" variant="outline">
                        Apply Mappings
                    </Button>
                    <Button onClick={addRule} size="sm" type="button" variant="outline">
                        Add Rule
                    </Button>
                </div>
            </div>

            <TokenMappingsSection />

            <div className="rounded-md border bg-muted/30 p-3">
                <div className="mb-2 text-muted-foreground text-xs">Suggestions</div>
                <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_RULES.map((c) => (
                        <Button
                            key={c.label}
                            onClick={() => addSuggestedRule(c.rule, c.label)}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            + {c.label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {rules.map((rule, index) => (
                    <RuleRow
                        index={index}
                        // force remount for uncontrolled inputs when JSON tab overwrites options
                        key={`${index}-${JSON.stringify(rule)}`}
                        onDelete={deleteRule}
                        onPatch={patchRule}
                        onSetPatternKey={setPatternKey}
                        onSetPatternValue={setPatternValue}
                        rule={rule}
                    />
                ))}
                {rules.length === 0 && <p className="text-muted-foreground text-sm italic">No rules configured.</p>}
            </div>
        </div>
    );
};
