'use client';

import {
    BotIcon,
    DownloadIcon,
    HighlighterIcon,
    MergeIcon,
    SaveIcon,
    SquareDashedIcon,
    TextCursorInputIcon,
    TrashIcon,
} from 'lucide-react';
import { record } from 'nanolytics';
import React from 'react';

import { Button } from '@/components/ui/button';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { generateTranslationText } from '@/lib/ai';
import { mapBookStateToKitab, mapKitabToLegacyFormat } from '@/lib/bookFormats';
import { TRANSLATE_BOOK_PROMPT } from '@/lib/constants';
import { downloadFile } from '@/lib/domUtils';
import { selectCurrentPages } from '@/stores/bookStore/selectors';
import { useBookStore } from '@/stores/bookStore/useBookStore';

import TocMenu from './toc-menu';
import { TranslateDialog } from './translate-dialog';

type BookToolbarProps = {
    onDeleteSelectedPages?: () => void;
    onMergeFootnotes?: () => void;
    onReformatSelectedPages?: () => void;
    onSelectEmptyPages?: () => void;
};

/**
 * Renders a toolbar for manuscript management operations.
 * Currently provides functionality to export the current manuscript state as a JSON file.
 */
function BookToolbar({
    onDeleteSelectedPages,
    onMergeFootnotes,
    onReformatSelectedPages,
    onSelectEmptyPages,
}: BookToolbarProps) {
    const toggleHighlighter = useBookStore((state) => state.toggleHighlighter);
    const isHighlighterEnabled = useBookStore((state) => state.isHighlighterEnabled);

    return (
        <div className="flex space-x-2">
            <Button
                className="bg-emerald-500"
                onClick={() => {
                    const state = useBookStore.getState();
                    const name = prompt('Enter output file name', state.inputFileName);

                    if (name) {
                        record('DownloadBook', name);

                        downloadFile(
                            name.endsWith('.json') ? name : `${name}.json`,
                            JSON.stringify(mapBookStateToKitab(state), null, 2),
                        );
                    }
                }}
            >
                <SaveIcon />
            </Button>
            <Button
                onClick={() => {
                    const name = prompt('Enter output file name');

                    if (name) {
                        record('DownloadLegacyBook', name);

                        const kitab = mapBookStateToKitab(useBookStore.getState());
                        const legacy = mapKitabToLegacyFormat(kitab);

                        downloadFile(name.endsWith('.json') ? name : `${name}.json`, JSON.stringify(legacy, null, 2));
                    }
                }}
            >
                <DownloadIcon /> Legacy
            </Button>
            <TocMenu
                onBookmarkClicked={() => {
                    record('BookmarkClicked');
                }}
            />
            {onDeleteSelectedPages && (
                <Button aria-label="Delete selected pages" onClick={onDeleteSelectedPages} variant="destructive">
                    <TrashIcon />
                </Button>
            )}
            {onReformatSelectedPages && (
                <Button aria-label="Reformat selected pages" onClick={onReformatSelectedPages}>
                    <TextCursorInputIcon /> Reformat
                </Button>
            )}
            {onMergeFootnotes && (
                <Button aria-label="Merge Footnotes" className="bg-purple-500" onClick={onMergeFootnotes}>
                    <MergeIcon /> Merge Footnotes
                </Button>
            )}
            {onSelectEmptyPages && (
                <Button aria-label="Select Blank pages" className="bg-red-400" onClick={onSelectEmptyPages}>
                    <SquareDashedIcon /> Select Blank
                </Button>
            )}
            <Button
                aria-label="Highlighter"
                className={isHighlighterEnabled ? 'bg-purple-400' : undefined}
                onClick={toggleHighlighter}
            >
                <HighlighterIcon />
            </Button>
            <DialogTriggerButton
                aria-label="Translate Book"
                onClick={() => {
                    record('TranslateBook');
                }}
                renderContent={() => {
                    const defaultText = generateTranslationText(
                        selectCurrentPages(useBookStore.getState()).filter((p) => p.text),
                    ).join('\n\n');

                    return <TranslateDialog defaultPrompt={TRANSLATE_BOOK_PROMPT} defaultText={defaultText} />;
                }}
                variant="outline"
            >
                <BotIcon /> AI Translate
            </DialogTriggerButton>
        </div>
    );
}

export default React.memo(BookToolbar);
