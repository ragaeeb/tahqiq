'use client';

import { estimateTokenCount } from 'bitaboom';
import { ClipboardCopyIcon, RefreshCwIcon, SendIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { formatExcerptsForPrompt, getPrompts } from 'wobble-bibble';
import { Pill } from '@/components/pill';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { pageNumberToColor } from '@/lib/colorUtils';
import { MASTER_PROMPT_ID, type TranslationModel } from '@/lib/constants';
import { groupIdsByTokenLimits, type TokenGroup } from '@/lib/grouping';
import { getUntranslatedIds } from '@/lib/segmentation';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';

// Maximum pills to render for performance
const MAX_VISIBLE_PILLS = 500;

interface PickerTabProps {
    model: TranslationModel;
}

/**
 * Tab content for selecting untranslated excerpts to send to LLM.
 * Shows pills with excerpt IDs organized by token limit groups,
 * supports range selection, and provides copy/remove/reset functionality.
 */
export function PickerTab({ model }: PickerTabProps) {
    const excerpts = useExcerptsStore((state) => state.excerpts);
    const headings = useExcerptsStore((state) => state.headings);
    const footnotes = useExcerptsStore((state) => state.footnotes);
    const sentToLlmIds = useExcerptsStore((state) => state.sentToLlmIds);
    const promptForTranslation = useExcerptsStore((state) => state.promptForTranslation);
    const promptId = useExcerptsStore((state) => state.promptId);
    const setPrompt = useExcerptsStore((state) => state.setPrompt);
    const markAsSentToLlm = useExcerptsStore((state) => state.markAsSentToLlm);
    const resetSentToLlm = useExcerptsStore((state) => state.resetSentToLlm);

    const prompts = getPrompts();
    const visiblePrompts = useMemo(() => prompts.filter((p) => p.id !== MASTER_PROMPT_ID), [prompts]);

    // Handle prompt selection
    const handlePromptChange = useCallback(
        (val: string) => {
            const selected = prompts.find((p) => p.id === val);
            if (selected) {
                setPrompt(val, selected.content);
                record('SelectTranslationPrompt', val);
            }
        },
        [prompts, setPrompt],
    );

    // Auto-select first prompt if none selected and prompts available (only on mount)
    const hasAutoSelected = useRef(false);
    useEffect(() => {
        if (!hasAutoSelected.current && !promptId && visiblePrompts.length > 0) {
            hasAutoSelected.current = true;
            const first = visiblePrompts[0];
            setPrompt(first.id, first.content);
        }
    }, [promptId, visiblePrompts, setPrompt]);

    // Combine all selectable items
    const allItems = useMemo(() => [...excerpts, ...headings, ...footnotes], [excerpts, headings, footnotes]);

    // Get untranslated IDs not already sent - computed once
    const availableIds = useMemo(() => getUntranslatedIds(allItems, sentToLlmIds), [allItems, sentToLlmIds]);

    // Selected index (from 0 to this index inclusive)
    const [selectedEndIndex, setSelectedEndIndex] = useState<number | null>(null);

    // Limit displayed pills for performance
    const displayedIds = useMemo(() => availableIds.slice(0, MAX_VISIBLE_PILLS), [availableIds]);
    const hasMore = availableIds.length > MAX_VISIBLE_PILLS;

    // Build item lookup map once for O(1) access
    const itemMap = useMemo(() => {
        const map = new Map<string, (typeof allItems)[0]>();
        for (const e of allItems) {
            map.set(e.id, e);
        }
        return map;
    }, [allItems]);

    // Group IDs by token limits
    const tokenGroups = useMemo((): TokenGroup[] => {
        if (displayedIds.length === 0 || !promptForTranslation) {
            return groupIdsByTokenLimits([], () => undefined, 0);
        }

        // Use provider from model object directly
        const provider = model.provider;

        // Pass provider to estimateTokenCount
        const promptTokens = estimateTokenCount(promptForTranslation, provider);

        return groupIdsByTokenLimits(displayedIds, (id) => itemMap.get(id)?.nass, promptTokens, provider);
    }, [displayedIds, itemMap, promptForTranslation, model]);

    // Get selected IDs (from first to selectedEndIndex)
    const selectedIds = useMemo(() => {
        if (selectedEndIndex === null) {
            return [];
        }
        return availableIds.slice(0, selectedEndIndex + 1);
    }, [availableIds, selectedEndIndex]);

    // Get selected items for formatting using map lookup
    const selectedItems = useMemo(() => {
        return selectedIds.map((id) => itemMap.get(id)).filter(Boolean) as typeof allItems;
    }, [itemMap, selectedIds]);

    // Format content for clipboard
    const formattedContent = useMemo(() => {
        if (selectedItems.length === 0 || !promptForTranslation) {
            return '';
        }
        return formatExcerptsForPrompt(
            selectedItems.map((s) => ({ id: s.id, text: s.nass })),
            promptForTranslation,
        );
    }, [selectedItems, promptForTranslation]);

    // Estimate token count - also use provider here for accurate count (although less critical for display, good for consistency)
    const tokenCount = useMemo(() => {
        return estimateTokenCount(formattedContent, model.provider);
    }, [formattedContent, model]);

    // Find original index in displayedIds for a given id
    const getOriginalIndex = useCallback((id: string) => displayedIds.indexOf(id), [displayedIds]);

    const handlePillClick = useCallback(
        (id: string) => {
            const index = getOriginalIndex(id);
            if (index !== -1) {
                setSelectedEndIndex(index);
            }
        },
        [getOriginalIndex],
    );

    const handleCopy = useCallback(async () => {
        if (!formattedContent) {
            toast.error('No excerpts selected');
            return;
        }

        try {
            await navigator.clipboard.writeText(formattedContent);
            record('CopyTranslationPrompt', `${selectedIds.length} excerpts, ${tokenCount} tokens`);

            toast.success(`Copied ${selectedIds.length} excerpts (~${tokenCount.toLocaleString()} tokens)`);
        } catch (err) {
            console.error('Failed to copy:', err);
            toast.error('Failed to copy to clipboard');
        }
    }, [formattedContent, selectedIds.length, tokenCount]);

    const handleRemove = useCallback(async () => {
        record('MarkAsSentToLlm', `${selectedIds.length} excerpts`);

        await navigator.clipboard.writeText(formattedContent);

        markAsSentToLlm(selectedIds);
        toast.success(`Copied and Marked ${selectedIds.length} excerpts as sent`);

        setSelectedEndIndex(null);
    }, [selectedIds, markAsSentToLlm, formattedContent]);

    const handleReset = useCallback(() => {
        record('ResetSentToLlm');
        resetSentToLlm();
        setSelectedEndIndex(null);
        toast.info('Reset sent tracking');
    }, [resetSentToLlm]);

    // Check if a group has any selected items
    const isGroupPartiallySelected = useCallback(
        (group: TokenGroup) => {
            if (selectedEndIndex === null) {
                return false;
            }
            return group.ids.some((id) => {
                const idx = getOriginalIndex(id);
                return idx !== -1 && idx <= selectedEndIndex;
            });
        },
        [selectedEndIndex, getOriginalIndex],
    );

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-4">
                    <Label htmlFor="prompt-select" className="whitespace-nowrap font-semibold">
                        Translation Prompt:
                    </Label>
                    <Select value={promptId} onValueChange={handlePromptChange}>
                        <SelectTrigger id="prompt-select" className="w-64">
                            <SelectValue placeholder="Select a prompt template" />
                        </SelectTrigger>
                        <SelectContent>
                            {visiblePrompts.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {selectedIds.length > 0 && (
                        <span className="font-mono text-blue-600 text-sm">
                            {selectedIds.length} selected • ~{tokenCount.toLocaleString()} tokens
                        </span>
                    )}
                    <div className="flex gap-3 font-medium text-[8px] text-gray-400">
                        <span>Grok 4: 256k / 4.1: 2M</span>
                        <span>GPT-5.2: 400k / 5o: 128k</span>
                        <span>Gemini 3 Pro: 1M</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {availableIds.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-gray-500 text-sm">
                        No untranslated items available
                    </div>
                ) : (
                    <div className="h-full overflow-auto rounded border">
                        <table className="w-full">
                            <tbody>
                                {tokenGroups.map((group) => {
                                    if (group.ids.length === 0) {
                                        return null;
                                    }
                                    const isPartiallySelected = isGroupPartiallySelected(group);
                                    return (
                                        <tr
                                            key={group.label}
                                            className={`border-b last:border-b-0 ${isPartiallySelected ? 'bg-blue-50' : ''}`}
                                        >
                                            <td className="w-24 border-r bg-gray-50 px-3 py-2 text-center align-top font-medium text-gray-600 text-sm">
                                                {group.label}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {group.ids.map((id) => {
                                                        const originalIndex = getOriginalIndex(id);
                                                        const item = itemMap.get(id);
                                                        const bgColor = item
                                                            ? pageNumberToColor(item.from as number)
                                                            : undefined;
                                                        return (
                                                            <Pill
                                                                key={id}
                                                                id={id}
                                                                backgroundColor={bgColor}
                                                                isSelected={
                                                                    selectedEndIndex !== null &&
                                                                    originalIndex <= selectedEndIndex
                                                                }
                                                                onClick={() => handlePillClick(id)}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {hasMore && (
                            <div className="border-t bg-gray-50 py-2 text-center text-gray-500 text-sm">
                                Showing first {MAX_VISIBLE_PILLS.toLocaleString()} of{' '}
                                {availableIds.length.toLocaleString()} available.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-between gap-2 pt-4">
                <Button onClick={handleReset} variant="outline" title="Reset sent tracking">
                    <RefreshCwIcon className="mr-2 h-4 w-4" />
                    Reset
                </Button>
                <div className="flex gap-2">
                    <Button
                        onClick={handleCopy}
                        disabled={selectedIds.length === 0}
                        variant="outline"
                        title="Copy prompt + excerpts to clipboard"
                    >
                        <ClipboardCopyIcon className="mr-2 h-4 w-4" />
                        Copy
                    </Button>
                    <Button
                        onClick={handleRemove}
                        disabled={selectedIds.length === 0}
                        className="bg-blue-500 hover:bg-blue-600"
                        title="Copy prompt + excerpts and mark as sent"
                    >
                        <SendIcon className="mr-2 h-4 w-4" />
                        Copy + Use
                    </Button>
                </div>
            </div>
        </div>
    );
}
