'use client';

import { ClipboardCopyIcon, RefreshCwIcon, SendIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { estimateTokenCount, formatExcerptsForPrompt, getUntranslatedIds } from '@/lib/transform/excerpts';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';

type TranslationPickerDialogContentProps = { onClose: () => void };

/**
 * Dialog content for selecting untranslated excerpts to send to LLM.
 * Shows pills with excerpt IDs, supports range selection, and provides
 * copy/remove/reset functionality.
 */
export function TranslationPickerDialogContent({ onClose }: TranslationPickerDialogContentProps) {
    const excerpts = useExcerptsStore((state) => state.excerpts);
    const sentToLlmIds = useExcerptsStore((state) => state.sentToLlmIds);
    const promptForTranslation = useExcerptsStore((state) => state.promptForTranslation);
    const markAsSentToLlm = useExcerptsStore((state) => state.markAsSentToLlm);
    const resetSentToLlm = useExcerptsStore((state) => state.resetSentToLlm);

    // Get untranslated IDs not already sent
    const availableIds = useMemo(() => getUntranslatedIds(excerpts, sentToLlmIds), [excerpts, sentToLlmIds]);

    // Selected index (from 0 to this index inclusive)
    const [selectedEndIndex, setSelectedEndIndex] = useState<number | null>(null);

    // Get selected IDs (from first to selectedEndIndex)
    const selectedIds = useMemo(() => {
        if (selectedEndIndex === null) {
            return [];
        }
        return availableIds.slice(0, selectedEndIndex + 1);
    }, [availableIds, selectedEndIndex]);

    // Get selected excerpts for formatting
    const selectedExcerpts = useMemo(() => {
        const idSet = new Set(selectedIds);
        return excerpts.filter((e) => idSet.has(e.id));
    }, [excerpts, selectedIds]);

    // Format content for clipboard
    const formattedContent = useMemo(() => {
        if (selectedExcerpts.length === 0) {
            return '';
        }
        return formatExcerptsForPrompt(selectedExcerpts, promptForTranslation);
    }, [selectedExcerpts, promptForTranslation]);

    // Estimate token count
    const tokenCount = useMemo(() => estimateTokenCount(formattedContent), [formattedContent]);

    const handlePillClick = (index: number) => {
        setSelectedEndIndex(index);
    };

    const handleCopy = async () => {
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
    };

    const handleRemove = () => {
        if (selectedIds.length === 0) {
            toast.error('No excerpts selected');
            return;
        }

        record('MarkAsSentToLlm', `${selectedIds.length} excerpts`);
        markAsSentToLlm(selectedIds);
        toast.success(`Marked ${selectedIds.length} excerpts as sent`);
        onClose();
    };

    const handleReset = () => {
        record('ResetSentToLlm');
        resetSentToLlm();
        setSelectedEndIndex(null);
        toast.info('Reset sent tracking');
    };

    return (
        <DialogContent className="!max-w-[80vw] flex h-[70vh] w-[80vw] flex-col">
            <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                    <span>Select Excerpts for Translation</span>
                    {selectedIds.length > 0 && (
                        <span className="font-mono text-blue-600 text-sm">
                            {selectedIds.length} selected • ~{tokenCount.toLocaleString()} tokens
                        </span>
                    )}
                </DialogTitle>
            </DialogHeader>

            {availableIds.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-gray-500">
                    <p>No untranslated excerpts available</p>
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-auto rounded border p-4">
                        <div className="flex flex-wrap gap-2">
                            {availableIds.map((id, index) => {
                                const isSelected = selectedEndIndex !== null && index <= selectedEndIndex;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => handlePillClick(index)}
                                        className={`rounded-full px-3 py-1 text-sm transition-colors ${
                                            isSelected
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {id}
                                    </button>
                                );
                            })}
                        </div>
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
                                title="Mark as sent and close"
                            >
                                <SendIcon className="mr-2 h-4 w-4" />
                                Remove & Close
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </DialogContent>
    );
}
