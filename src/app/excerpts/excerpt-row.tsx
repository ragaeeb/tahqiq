'use client';

import { ArrowDownIcon, EyeIcon, PencilIcon, Trash2Icon, XIcon } from 'lucide-react';
import { record } from 'nanolytics';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmButton } from '@/components/confirm-button';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import { Textarea } from '@/components/ui/textarea';
import { createUpdate } from '@/lib/common';
import { Markers } from '@/lib/constants';
import { autoResizeTextarea } from '@/lib/domUtils';
import type { Excerpt } from '@/stores/excerptsStore/types';
import { EditExcerptDialogContent } from './edit-excerpt-dialog';

type ExcerptRowProps = {
    data: Excerpt;
    /** Hide the translation column to maximize Arabic text real estate */
    hideTranslation?: boolean;
    /** Whether this row is in a filtered view */
    isFiltered?: boolean;
    /** Whether this row is selected */
    isSelected?: boolean;
    onCreateFromSelection: (sourceId: string, selectedText: string) => void;
    onDelete: (id: string) => void;
    /** Toggle selection for this row */
    onToggleSelect?: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Omit<Excerpt, 'id'>>) => void;
    onCopyDown: (data: Excerpt) => void;
    /** Callback to show this row in full context (clear filter and scroll to it) */
    onShowInContext?: (id: string) => void;
};

function ExcerptRow({
    data,
    hideTranslation,
    isFiltered,
    isSelected,
    onCreateFromSelection,
    onDelete,
    onToggleSelect,
    onUpdate,
    onCopyDown,
    onShowInContext,
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
                        : data.meta?.type === Markers.Chapter
                          ? 'bg-green-50 hover:bg-green-100'
                          : data.meta?.type === Markers.Book
                            ? 'bg-blue-50 hover:bg-blue-100'
                            : 'hover:bg-gray-50'
                }`}
            >
                {onToggleSelect && (
                    <td className="w-8 px-1 py-1 text-center align-top">
                        <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(data.id)} />
                    </td>
                )}
                <td className="group w-24 px-1 py-1 text-center align-top text-gray-600 text-xs">
                    <div className="flex items-center justify-center gap-1">
                        {isEditingPages ? (
                            <input
                                className="w-full bg-transparent text-center text-gray-600 text-xs outline-none"
                                defaultValue={[data.from, data.to].filter(Boolean).join('-')}
                                onBlur={(e) => {
                                    const updates = createUpdate(e.target.value.trim(), data);

                                    if (updates) {
                                        onUpdate(data.id, updates);
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
                            <>
                                <button
                                    className="cursor-pointer bg-transparent"
                                    onDoubleClick={() => setIsEditingPages(true)}
                                    title={data.id}
                                    type="button"
                                >
                                    {[data.from, data.to].filter(Boolean).join('-')}{' '}
                                    {data.meta?.num && `#${data.meta?.num}`}
                                </button>
                                {isFiltered && onShowInContext && (
                                    <Button
                                        className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
                                        onClick={() => onShowInContext(data.id)}
                                        size="icon"
                                        title="Show in context (clear filter and scroll to this row)"
                                        variant="ghost"
                                    >
                                        <EyeIcon className="h-3 w-3" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </td>
                <td className="relative px-2 py-1 align-top" dir="rtl">
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
                    <td className="px-2 py-1 align-top">
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
                <td className="w-28 px-1 py-1 text-center align-top">
                    <div className="flex items-center justify-center gap-0">
                        <DialogTriggerButton
                            aria-label={`Edit excerpt ${data.id}`}
                            className="h-7 w-7 p-0"
                            onClick={() => record('EditExcerptOpen', data.id)}
                            renderContent={() => <EditExcerptDialogContent excerpt={data} onUpdate={onUpdate} />}
                            variant="ghost"
                        >
                            <PencilIcon className="h-4 w-4 text-blue-500" />
                        </DialogTriggerButton>
                        <ConfirmButton
                            aria-label={`Delete excerpt ${data.id}`}
                            className="h-7 w-7 p-0"
                            onClick={() => onDelete(data.id)}
                            title="Delete excerpt"
                            variant="ghost"
                            size="icon"
                        >
                            <Trash2Icon className="h-4 w-4 text-red-500" />
                        </ConfirmButton>
                        {data.text && (
                            <ConfirmButton
                                aria-label={`Clear translation for ${data.id}`}
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                    record('ClearTranslation', data.id);
                                    onUpdate(data.id, { text: '' });
                                }}
                                title="Clear translation"
                                variant="ghost"
                                size="icon"
                            >
                                <XIcon className="h-4 w-4 text-orange-500" />
                            </ConfirmButton>
                        )}
                        <Button
                            aria-label={`Copy translation down from ${data.id}`}
                            className="h-7 w-7 p-0"
                            onClick={() => {
                                record('CopyTranslationDown');
                                onCopyDown(data);
                            }}
                            title="Copy translation to row below"
                            variant="ghost"
                        >
                            <ArrowDownIcon className="h-4 w-4 text-emerald-500" />
                        </Button>
                    </div>
                </td>
            </tr>
            {floatingButton}
        </>
    );
}

export default React.memo(ExcerptRow);
