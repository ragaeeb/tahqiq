'use client';

import { PencilIcon, Trash2Icon } from 'lucide-react';
import { record } from 'nanolytics';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { Textarea } from '@/components/ui/textarea';
import { autoResizeTextarea } from '@/lib/domUtils';
import type { Excerpt } from '@/stores/excerptsStore/types';
import { EditExcerptDialogContent } from './edit-excerpt-dialog';

type ExcerptRowProps = {
    data: Excerpt;
    /** Hide the translation column to maximize Arabic text real estate */
    hideTranslation?: boolean;
    /** Whether this row is selected */
    isSelected?: boolean;
    onCreateFromSelection: (sourceId: string, selectedText: string) => void;
    onDelete: (id: string) => void;
    /** Toggle selection for this row */
    onToggleSelect?: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Omit<Excerpt, 'id'>>) => void;
};

function ExcerptRow({
    data,
    hideTranslation,
    isSelected,
    onCreateFromSelection,
    onDelete,
    onToggleSelect,
    onUpdate,
}: ExcerptRowProps) {
    const [selectedText, setSelectedText] = useState('');
    const [showExtractButton, setShowExtractButton] = useState(false);
    const [buttonPosition, setButtonPosition] = useState({ left: 0, top: 0 });
    const [isEditingPages, setIsEditingPages] = useState(false);

    const handleTextSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        const selection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);

        if (selection && selection.trim().length > 0) {
            setSelectedText(selection);

            // Position button fixed near the selection
            const rect = textarea.getBoundingClientRect();

            const top = Math.max(10, rect.top - 40);
            setButtonPosition({ left: rect.left + 10, top });

            setShowExtractButton(true);
        } else {
            setShowExtractButton(false);
        }
    };

    const handleExtract = () => {
        if (selectedText) {
            record('ExtractExcerptFromSelection');
            onCreateFromSelection(data.id, selectedText);
            setShowExtractButton(false);
            setSelectedText('');
        }
    };

    // Render floating button via Portal to avoid DOM nesting issues
    const floatingButton =
        showExtractButton && typeof document !== 'undefined'
            ? createPortal(
                  <div
                      className="pointer-events-none fixed z-50"
                      style={{ left: `${buttonPosition.left}px`, top: `${buttonPosition.top}px` }}
                  >
                      <Button
                          className="fade-in zoom-in-95 pointer-events-auto flex animate-in items-center gap-1 shadow-lg duration-200"
                          onClick={handleExtract}
                          onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
                          size="sm"
                          variant="default"
                      >
                          <svg
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                          >
                              <title>Extract Excerpt Icon</title>
                              <path
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                              />
                          </svg>
                          <span className="text-xs">Extract as New Excerpt</span>
                      </Button>
                  </div>,
                  document.body,
              )
            : null;

    return (
        <>
            <tr
                className={`border-gray-100 border-b transition-colors duration-150 ease-in-out ${
                    isSelected
                        ? 'bg-blue-100 hover:bg-blue-200'
                        : data.meta?.type === 'chapter'
                          ? 'bg-green-50 hover:bg-green-100'
                          : data.meta?.type === 'book'
                            ? 'bg-blue-50 hover:bg-blue-100'
                            : 'hover:bg-gray-50'
                }`}
            >
                {onToggleSelect && (
                    <td className="w-10 px-2 py-3 text-center align-top">
                        <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(data.id)} />
                        {data.nass.length}
                    </td>
                )}
                <td className="w-32 px-2 py-3 text-center align-top text-gray-600 text-xs">
                    {isEditingPages ? (
                        <input
                            className="w-full bg-transparent text-center text-gray-600 text-xs outline-none"
                            defaultValue={[data.from, data.to].filter(Boolean).join('-')}
                            onBlur={(e) => {
                                const value = e.target.value.trim();
                                const parts = value.split('-').map((p) => Number.parseInt(p.trim(), 10));
                                const newFrom = parts[0];
                                const newTo = parts.length > 1 ? parts[1] : undefined;

                                // Check if values actually changed
                                const fromChanged = !Number.isNaN(newFrom) && newFrom !== data.from;
                                const toChanged =
                                    newTo !== undefined
                                        ? !Number.isNaN(newTo) && newTo !== data.to
                                        : data.to !== undefined;

                                if (fromChanged || toChanged) {
                                    const updates: { from?: number; to?: number } = {};
                                    if (!Number.isNaN(newFrom)) {
                                        updates.from = newFrom;
                                    }
                                    if (newTo !== undefined && !Number.isNaN(newTo)) {
                                        updates.to = newTo;
                                    } else if (newTo === undefined && data.to !== undefined) {
                                        // User removed the 'to' value (e.g., changed "100-200" to "100")
                                        updates.to = undefined;
                                    }
                                    if (Object.keys(updates).length > 0) {
                                        onUpdate(data.id, updates);
                                    }
                                }
                                setIsEditingPages(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                } else if (e.key === 'Escape') {
                                    setIsEditingPages(false);
                                }
                            }}
                            ref={(el) => el?.focus()}
                            type="text"
                        />
                    ) : (
                        <button
                            className="cursor-pointer bg-transparent"
                            onDoubleClick={() => setIsEditingPages(true)}
                            title="Double-click to edit"
                            type="button"
                        >
                            {[data.from, data.to].filter(Boolean).join('-')} {data.meta?.num && `#${data.meta?.num}`}
                        </button>
                    )}
                </td>
                <td className="relative px-4 py-3 align-top" dir="rtl">
                    <Textarea
                        className="min-h-[60px] w-full resize-none overflow-hidden border-none bg-transparent p-2 text-right font-arabic text-gray-800 text-lg leading-relaxed shadow-none focus:outline-none focus:ring-0"
                        defaultValue={data.nass ?? ''}
                        key={`${data.id}/${data.lastUpdatedAt}/nass`}
                        onBlur={(e) => {
                            if (e.target.value !== (data.nass ?? '')) {
                                autoResizeTextarea(e.currentTarget);
                                onUpdate(data.id, { nass: e.target.value });
                            }
                            // Hide button when textarea loses focus (with delay for button click)
                            setTimeout(() => setShowExtractButton(false), 200);
                        }}
                        onMouseUp={handleTextSelect}
                        onSelect={handleTextSelect}
                        placeholder="النص العربي..."
                        ref={autoResizeTextarea}
                    />
                </td>
                {!hideTranslation && (
                    <td className="px-4 py-3 align-top">
                        <Textarea
                            className="min-h-[60px] w-full resize-none overflow-hidden border-none bg-transparent p-2 text-gray-700 text-sm leading-relaxed shadow-none focus:outline-none focus:ring-0"
                            defaultValue={data.text ?? ''}
                            key={`${data.id}/${data.lastUpdatedAt}/text`}
                            onBlur={(e) => {
                                if (e.target.value !== (data.text ?? '')) {
                                    autoResizeTextarea(e.currentTarget);
                                    onUpdate(data.id, { text: e.target.value });
                                }
                            }}
                            placeholder="Translation..."
                            ref={autoResizeTextarea}
                        />
                    </td>
                )}
                <td className="w-24 px-2 py-3 text-center align-top">
                    <div className="flex items-center justify-center gap-1">
                        <DialogTriggerButton
                            aria-label={`Edit excerpt ${data.id}`}
                            onClick={() => record('EditExcerptOpen', data.id)}
                            renderContent={() => <EditExcerptDialogContent excerpt={data} onUpdate={onUpdate} />}
                            size="sm"
                            variant="ghost"
                        >
                            <PencilIcon className="h-4 w-4 text-blue-500" />
                        </DialogTriggerButton>
                        <Button
                            aria-label={`Delete excerpt ${data.id}`}
                            onClick={() => onDelete(data.id)}
                            size="sm"
                            variant="ghost"
                        >
                            <Trash2Icon className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                </td>
            </tr>
            {floatingButton}
        </>
    );
}

export default React.memo(ExcerptRow);
