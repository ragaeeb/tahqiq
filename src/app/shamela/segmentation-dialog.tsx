'use client';

import {
    type Breakpoint,
    getAvailableTokens,
    type Page,
    type Segment,
    type SegmentationOptions,
    type SplitRule,
    segmentPages,
    TOKEN_PATTERNS,
} from 'flappa-doormal';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, SparklesIcon, Trash2Icon, WandIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { htmlToMarkdown } from 'shamela';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LatestContractVersion } from '@/lib/constants';
import { saveCompressed } from '@/lib/io';
import { analyzeTextForRule } from '@/lib/pattern-detection';
import type { Excerpts } from '@/stores/excerptsStore/types';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import type { ShamelaPage } from '@/stores/shamelaStore/types';

import {
    type BreakpointFormState,
    createEmptyBreakpoint,
    createEmptyRule,
    DEFAULT_FORM_STATE,
    type PatternType,
    PRESETS,
    type RuleFormState,
    SEGMENTATION_STORAGE_KEY,
    type SegmentationFormState,
} from './segmentation-types';

type SegmentationDialogContentProps = { pages: ShamelaPage[]; selectedText?: string };

/**
 * Converts form state rules to flappa-doormal SplitRule format
 */
const convertRuleToSplitRule = (rule: RuleFormState): SplitRule | null => {
    const patterns = rule.patterns.filter((p) => p.trim());
    if (patterns.length === 0) {
        return null;
    }

    const base: Partial<SplitRule> = {
        split: rule.split,
        ...(rule.fuzzy && { fuzzy: true }),
        ...(rule.occurrence && rule.occurrence !== 'all' && { occurrence: rule.occurrence }),
        ...(rule.min !== undefined && { min: rule.min }),
        ...(rule.max !== undefined && { max: rule.max }),
        ...(rule.maxSpan !== undefined && { maxSpan: rule.maxSpan }),
        ...(rule.metaType && { meta: { type: rule.metaType } }),
    };

    switch (rule.patternType) {
        case 'lineStartsWith':
            return { ...base, lineStartsWith: patterns, split: rule.split } as SplitRule;
        case 'lineStartsAfter':
            return { ...base, lineStartsAfter: patterns, split: rule.split } as SplitRule;
        case 'lineEndsWith':
            return { ...base, lineEndsWith: patterns, split: rule.split } as SplitRule;
        case 'template':
            return { ...base, split: rule.split, template: patterns[0] } as SplitRule;
        case 'regex':
            return { ...base, regex: patterns[0], split: rule.split } as SplitRule;
        default:
            return null;
    }
};

/**
 * Converts form state breakpoints to flappa-doormal Breakpoint format
 */
const convertBreakpointToBreakpoint = (bp: BreakpointFormState): Breakpoint => {
    if (bp.min !== undefined || bp.max !== undefined || bp.exclude) {
        const excludeArray = bp.exclude
            ? bp.exclude
                  .split(',')
                  .map((s) => {
                      const trimmed = s.trim();
                      if (trimmed.includes('-')) {
                          const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim(), 10));
                          return [start, end] as [number, number];
                      }
                      return parseInt(trimmed, 10);
                  })
                  .filter((n) => !Number.isNaN(Array.isArray(n) ? n[0] : n))
            : undefined;

        return {
            pattern: bp.pattern,
            ...(bp.min !== undefined && { min: bp.min }),
            ...(bp.max !== undefined && { max: bp.max }),
            ...(excludeArray && excludeArray.length > 0 && { exclude: excludeArray }),
        };
    }
    return bp.pattern;
};

/**
 * Token reference component with clickable tokens
 */
function TokenReference({ onInsert }: { onInsert: (token: string) => void }) {
    const tokens = getAvailableTokens();

    return (
        <div className="rounded-lg border bg-muted/50 p-3">
            <Label className="font-medium text-muted-foreground text-xs">Available Tokens:</Label>
            <div className="mt-2 flex flex-wrap gap-1">
                {tokens.map((token) => (
                    <button
                        className="rounded bg-primary/10 px-2 py-0.5 font-mono text-primary text-xs transition-colors hover:bg-primary/20"
                        key={token}
                        onClick={() => onInsert(`{{${token}}}`)}
                        title={TOKEN_PATTERNS[token]}
                        type="button"
                    >
                        {`{{${token}}}`}
                    </button>
                ))}
            </div>
            <p className="mt-2 text-muted-foreground text-xs">
                Click to insert. Add <code className="bg-muted px-1">:name</code> for capture:{' '}
                <code className="bg-muted px-1">{'{{raqms:num}}'}</code>
            </p>
        </div>
    );
}

/**
 * Single rule editor component
 */
function RuleEditor({
    rule,
    onUpdate,
    onRemove,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
}: {
    rule: RuleFormState;
    onUpdate: (updates: Partial<RuleFormState>) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    isFirst: boolean;
    isLast: boolean;
}) {
    const handlePatternChange = (index: number, value: string) => {
        const newPatterns = [...rule.patterns];
        newPatterns[index] = value;
        onUpdate({ patterns: newPatterns });
    };

    const addPattern = () => {
        onUpdate({ patterns: [...rule.patterns, ''] });
    };

    const removePattern = (index: number) => {
        if (rule.patterns.length > 1) {
            onUpdate({ patterns: rule.patterns.filter((_, i) => i !== index) });
        }
    };

    return (
        <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Select onValueChange={(v: PatternType) => onUpdate({ patternType: v })} value={rule.patternType}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lineStartsWith">Line Starts With</SelectItem>
                            <SelectItem value="lineStartsAfter">Line Starts After</SelectItem>
                            <SelectItem value="lineEndsWith">Line Ends With</SelectItem>
                            <SelectItem value="template">Template</SelectItem>
                            <SelectItem value="regex">Regex</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select onValueChange={(v: 'at' | 'after') => onUpdate({ split: v })} value={rule.split}>
                        <SelectTrigger className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="at">Split At</SelectItem>
                            <SelectItem value="after">Split After</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-1">
                    <Button disabled={isFirst} onClick={onMoveUp} size="icon" title="Move up" variant="ghost">
                        <ChevronUpIcon className="h-4 w-4" />
                    </Button>
                    <Button disabled={isLast} onClick={onMoveDown} size="icon" title="Move down" variant="ghost">
                        <ChevronDownIcon className="h-4 w-4" />
                    </Button>
                    <Button onClick={onRemove} size="icon" title="Remove rule" variant="ghost">
                        <Trash2Icon className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </div>

            {/* Pattern inputs */}
            <div className="space-y-2">
                {rule.patterns.map((pattern, idx) => (
                    <div className="flex items-center gap-2" key={`${rule.id}-pattern-${idx}`}>
                        <Input
                            className="flex-1 font-mono text-sm"
                            dir="auto"
                            onChange={(e) => handlePatternChange(idx, e.target.value)}
                            placeholder={rule.patternType === 'regex' ? 'Regex pattern' : 'Pattern with {{tokens}}'}
                            value={pattern}
                        />
                        {rule.patterns.length > 1 && (
                            <Button onClick={() => removePattern(idx)} size="icon" variant="ghost">
                                <Trash2Icon className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                ))}
                {['lineStartsWith', 'lineStartsAfter', 'lineEndsWith'].includes(rule.patternType) && (
                    <Button className="h-7 text-xs" onClick={addPattern} size="sm" variant="outline">
                        <PlusIcon className="mr-1 h-3 w-3" /> Add Pattern
                    </Button>
                )}
            </div>

            {/* Options row */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={rule.fuzzy ?? false}
                        id={`fuzzy-${rule.id}`}
                        onCheckedChange={(checked) => onUpdate({ fuzzy: checked })}
                    />
                    <Label className="text-xs" htmlFor={`fuzzy-${rule.id}`}>
                        Fuzzy
                    </Label>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-xs">Type:</Label>
                    <Select
                        onValueChange={(v) =>
                            onUpdate({ metaType: v === 'none' ? undefined : (v as RuleFormState['metaType']) })
                        }
                        value={rule.metaType || 'none'}
                    >
                        <SelectTrigger className="h-7 w-24">
                            <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="chapter">Chapter</SelectItem>
                            <SelectItem value="hadith">Hadith</SelectItem>
                            <SelectItem value="book">Book</SelectItem>
                            <SelectItem value="section">Section</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-xs">Min:</Label>
                    <Input
                        className="h-7 w-16"
                        onChange={(e) => onUpdate({ min: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                        placeholder="—"
                        type="number"
                        value={rule.min ?? ''}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-xs">Max:</Label>
                    <Input
                        className="h-7 w-16"
                        onChange={(e) => onUpdate({ max: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                        placeholder="—"
                        type="number"
                        value={rule.max ?? ''}
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * Breakpoint editor component
 */
function BreakpointEditor({
    breakpoint,
    onUpdate,
    onRemove,
}: {
    breakpoint: BreakpointFormState;
    onUpdate: (updates: Partial<BreakpointFormState>) => void;
    onRemove: () => void;
}) {
    return (
        <div className="flex items-center gap-2 rounded border p-2">
            <Input
                className="flex-1 font-mono text-sm"
                onChange={(e) => onUpdate({ pattern: e.target.value })}
                placeholder="Pattern (empty = page boundary)"
                value={breakpoint.pattern}
            />
            <Input
                className="w-20"
                onChange={(e) => onUpdate({ exclude: e.target.value })}
                placeholder="Exclude"
                title="Comma-separated pages to exclude (e.g., 1,2,5-10)"
                value={breakpoint.exclude ?? ''}
            />
            <Button onClick={onRemove} size="icon" variant="ghost">
                <Trash2Icon className="h-4 w-4 text-destructive" />
            </Button>
        </div>
    );
}

/**
 * Main segmentation dialog content component
 */
export function SegmentationDialogContent({ pages, selectedText }: SegmentationDialogContentProps) {
    const router = useRouter();
    const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
    const [formState, setFormState] = useState<SegmentationFormState>(DEFAULT_FORM_STATE);
    const [selectedPreset, setSelectedPreset] = useState<string>('');
    const [previewCount, setPreviewCount] = useState<number | null>(null);

    // Load persisted config on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(SEGMENTATION_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as SegmentationFormState;
                setFormState(parsed);
                setMode('advanced');
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    // Auto-detect patterns from selected text
    useEffect(() => {
        if (selectedText && formState.rules.length === 0) {
            const analysis = analyzeTextForRule(selectedText);
            if (analysis) {
                const newRule: RuleFormState = {
                    fuzzy: analysis.fuzzy,
                    id: crypto.randomUUID(),
                    metaType: analysis.metaType as RuleFormState['metaType'],
                    patterns: [analysis.template],
                    patternType: analysis.patternType,
                    split: 'at',
                };
                setFormState((prev) => ({ ...prev, rules: [newRule] }));
                setMode('advanced');
                toast.success(`Detected pattern: ${analysis.template}`);
            }
        }
    }, [selectedText, formState.rules.length]);

    // Process pages for segmentation (convert HTML to markdown)
    // Handles both Shamela format (body field) and flappa-doormal test format (content field)
    const processedPages = useMemo((): Page[] => {
        const result = pages.map((p) => {
            // Support both 'body' (Shamela) and 'content' (flappa-doormal test data) fields
            const rawContent =
                (p as { body?: string; content?: string }).body ??
                (p as { body?: string; content?: string }).content ??
                '';
            const content = htmlToMarkdown(rawContent).replace(/舄/g, '');
            return { content, id: p.id };
        });
        console.log(
            'Processed pages sample:',
            result
                .slice(0, 2)
                .map((p) => ({ contentLength: p.content.length, id: p.id, preview: p.content.slice(0, 100) })),
        );
        return result;
    }, [pages]);

    // Convert form state to segmentation options
    const segmentationOptions = useMemo((): SegmentationOptions => {
        const rules: SplitRule[] = formState.rules
            .map(convertRuleToSplitRule)
            .filter((r): r is SplitRule => r !== null);

        const breakpoints: Breakpoint[] = formState.breakpoints
            .filter((bp) => bp.pattern !== undefined)
            .map(convertBreakpointToBreakpoint);

        return {
            rules,
            ...(breakpoints.length > 0 && { breakpoints }),
            ...(formState.maxPages !== undefined && { maxPages: formState.maxPages }),
            prefer: formState.prefer,
        };
    }, [formState]);

    // Calculate preview segment count
    const handlePreview = useCallback(() => {
        try {
            console.log('Preview - segmentation options:', JSON.stringify(segmentationOptions, null, 2));
            console.log('Preview - page count:', processedPages.length);
            const startTime = performance.now();

            const segments = segmentPages(processedPages, segmentationOptions);

            const endTime = performance.now();
            console.log(`Preview completed in ${endTime - startTime}ms, found ${segments.length} segments`);
            setPreviewCount(segments.length);
        } catch (error) {
            console.error('Preview failed:', error);
            toast.error('Failed to preview segments');
        }
    }, [processedPages, segmentationOptions]);

    // Apply preset configuration
    const handleApplyPreset = useCallback((presetName: string) => {
        const preset = PRESETS.find((p) => p.name === presetName);
        if (preset) {
            setFormState(preset.config);
            setSelectedPreset(presetName);
            record('ApplySegmentationPreset', presetName);
        }
    }, []);

    // Save configuration to localStorage
    const handleSaveConfig = useCallback(() => {
        try {
            localStorage.setItem(SEGMENTATION_STORAGE_KEY, JSON.stringify(formState));
            toast.success('Configuration saved');
        } catch {
            toast.error('Failed to save configuration');
        }
    }, [formState]);

    // Rule management
    const addRule = useCallback(() => {
        setFormState((prev) => ({ ...prev, rules: [...prev.rules, createEmptyRule()] }));
    }, []);

    const updateRule = useCallback((id: string, updates: Partial<RuleFormState>) => {
        setFormState((prev) => ({ ...prev, rules: prev.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)) }));
    }, []);

    const removeRule = useCallback((id: string) => {
        setFormState((prev) => ({ ...prev, rules: prev.rules.filter((r) => r.id !== id) }));
    }, []);

    const moveRule = useCallback((id: string, direction: 'up' | 'down') => {
        setFormState((prev) => {
            const idx = prev.rules.findIndex((r) => r.id === id);
            if (idx === -1) {
                return prev;
            }
            const newIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= prev.rules.length) {
                return prev;
            }
            const newRules = [...prev.rules];
            [newRules[idx], newRules[newIdx]] = [newRules[newIdx], newRules[idx]];
            return { ...prev, rules: newRules };
        });
    }, []);

    // Breakpoint management
    const addBreakpoint = useCallback(() => {
        setFormState((prev) => ({ ...prev, breakpoints: [...prev.breakpoints, createEmptyBreakpoint()] }));
    }, []);

    const updateBreakpoint = useCallback((id: string, updates: Partial<BreakpointFormState>) => {
        setFormState((prev) => ({
            ...prev,
            breakpoints: prev.breakpoints.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        }));
    }, []);

    const removeBreakpoint = useCallback((id: string) => {
        setFormState((prev) => ({ ...prev, breakpoints: prev.breakpoints.filter((b) => b.id !== id) }));
    }, []);

    // Handle token insertion
    const handleInsertToken = useCallback(
        (token: string) => {
            // Insert into the first rule's first pattern if exists
            if (formState.rules.length > 0) {
                const firstRule = formState.rules[0];
                const newPatterns = [...firstRule.patterns];
                newPatterns[0] = (newPatterns[0] || '') + token;
                updateRule(firstRule.id, { patterns: newPatterns });
            } else {
                // Create a new rule with the token
                const newRule = createEmptyRule();
                newRule.patterns = [token];
                setFormState((prev) => ({ ...prev, rules: [newRule] }));
            }
        },
        [formState.rules, updateRule],
    );

    // Finalize and navigate to excerpts
    const handleFinalize = useCallback(async () => {
        record('FinalizeSegmentation');

        try {
            console.log('Starting segmentation with options:', JSON.stringify(segmentationOptions, null, 2));
            console.log('Number of pages to process:', processedPages.length);

            // Show loading state
            toast.info('Segmenting pages...');

            // Use setTimeout to allow UI to update before heavy processing
            const segments = await new Promise<Segment[]>((resolve, reject) => {
                setTimeout(() => {
                    try {
                        const startTime = performance.now();
                        const result = segmentPages(processedPages, segmentationOptions);
                        const endTime = performance.now();
                        console.log(`Segmentation completed in ${endTime - startTime}ms`);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                }, 50);
            });

            console.log(
                'Segments:',
                segments.map((s) => ({ content: s.content.slice(0, 50), from: s.from, meta: s.meta })),
            );

            let idCount = 0;
            const excerpts: Excerpts = {
                contractVersion: LatestContractVersion.Excerpts,
                excerpts: segments.map((s) => ({
                    from: s.from,
                    ...(s.to && { to: s.to }),
                    id: `P${++idCount}`,
                    lastUpdatedAt: Date.now() / 1000,
                    nass: s.content,
                    text: '',
                    translator: 879,
                    vol: 1,
                    vp: 1,
                })),
                footnotes: [],
                headings: [],
            };

            // Save config for future use
            handleSaveConfig();

            try {
                await saveCompressed('excerpts', excerpts);
            } catch (err) {
                console.warn('Failed to save excerpts to storage, loading directly into store:', err);
                useExcerptsStore.getState().init(excerpts);
            }

            router.push('/excerpts');
            toast.success(`Created ${segments.length} segments`);
        } catch (error) {
            console.error('Segmentation failed:', error);
            toast.error(`Segmentation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [processedPages, segmentationOptions, router, handleSaveConfig]);

    return (
        <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <WandIcon className="h-5 w-5" />
                    Segment Pages
                </DialogTitle>
                <DialogDescription>
                    Configure rules to split pages into excerpts. {pages.length} pages loaded.
                </DialogDescription>
            </DialogHeader>

            <Tabs onValueChange={(v) => setMode(v as 'simple' | 'advanced')} value={mode}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="simple">Simple Mode</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced Mode</TabsTrigger>
                </TabsList>

                <TabsContent className="mt-4 max-h-[60vh] overflow-y-auto pr-2" value="simple">
                    <div className="space-y-4">
                        <div>
                            <Label className="font-medium text-sm">Choose a Preset:</Label>
                            <div className="mt-2 grid gap-2">
                                {PRESETS.map((preset) => (
                                    <button
                                        className={`rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                                            selectedPreset === preset.name ? 'border-primary bg-primary/5' : ''
                                        }`}
                                        key={preset.name}
                                        onClick={() => handleApplyPreset(preset.name)}
                                        type="button"
                                    >
                                        <div className="font-medium">{preset.name}</div>
                                        <div className="text-muted-foreground text-sm">{preset.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedText && (
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <SparklesIcon className="h-4 w-4" />
                                    <span className="font-medium text-sm">Detected from selection:</span>
                                </div>
                                <code className="mt-1 block text-blue-800 text-sm" dir="auto">
                                    {selectedText}
                                </code>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent className="mt-4 max-h-[60vh] overflow-y-auto pr-2" value="advanced">
                    <div className="space-y-6">
                        {/* Rules Section */}
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <Label className="font-medium text-sm">Split Rules</Label>
                                <Button onClick={addRule} size="sm" variant="outline">
                                    <PlusIcon className="mr-1 h-4 w-4" /> Add Rule
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {formState.rules.length === 0 ? (
                                    <p className="py-4 text-center text-muted-foreground text-sm">
                                        No rules configured. Add a rule or select a preset.
                                    </p>
                                ) : (
                                    formState.rules.map((rule, idx) => (
                                        <RuleEditor
                                            isFirst={idx === 0}
                                            isLast={idx === formState.rules.length - 1}
                                            key={rule.id}
                                            onMoveDown={() => moveRule(rule.id, 'down')}
                                            onMoveUp={() => moveRule(rule.id, 'up')}
                                            onRemove={() => removeRule(rule.id)}
                                            onUpdate={(updates) => updateRule(rule.id, updates)}
                                            rule={rule}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Token Reference */}
                        <TokenReference onInsert={handleInsertToken} />

                        {/* Breakpoints Section */}
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <Label className="font-medium text-sm">Breakpoints (for oversized segments)</Label>
                                <Button onClick={addBreakpoint} size="sm" variant="outline">
                                    <PlusIcon className="mr-1 h-4 w-4" /> Add
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {formState.breakpoints.map((bp) => (
                                    <BreakpointEditor
                                        breakpoint={bp}
                                        key={bp.id}
                                        onRemove={() => removeBreakpoint(bp.id)}
                                        onUpdate={(updates) => updateBreakpoint(bp.id, updates)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Global Settings */}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label className="text-sm">Max Pages:</Label>
                                <Input
                                    className="w-20"
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            maxPages: e.target.value ? parseInt(e.target.value, 10) : undefined,
                                        }))
                                    }
                                    type="number"
                                    value={formState.maxPages ?? ''}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-sm">Prefer:</Label>
                                <Select
                                    onValueChange={(v: 'longer' | 'shorter') =>
                                        setFormState((prev) => ({ ...prev, prefer: v }))
                                    }
                                    value={formState.prefer}
                                >
                                    <SelectTrigger className="w-28">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="longer">Longer</SelectItem>
                                        <SelectItem value="shorter">Shorter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Preview */}
            {previewCount !== null && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-700">
                    Preview: {previewCount} segments will be created
                </div>
            )}

            <DialogFooter className="gap-2">
                <Button onClick={handlePreview} variant="outline">
                    Preview ({formState.rules.length} rules)
                </Button>
                <Button onClick={handleSaveConfig} variant="outline">
                    Save Config
                </Button>
                <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button disabled={formState.rules.length === 0} onClick={handleFinalize}>
                    Segment Pages
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
