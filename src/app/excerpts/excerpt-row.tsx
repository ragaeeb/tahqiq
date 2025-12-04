'use client';

import { Trash2Icon } from 'lucide-react';
import { record } from 'nanolytics';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Excerpt } from '@/stores/excerptsStore/types';

type ExcerptRowProps = {
    data: Excerpt;
    onCreateFromSelection: (sourceId: string, selectedText: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Omit<Excerpt, 'id'>>) => void;
};

function ExcerptRow({ data, onCreateFromSelection, onDelete, onUpdate }: ExcerptRowProps) {
    const [selectedText, setSelectedText] = useState('');
    const [showExtractButton, setShowExtractButton] = useState(false);
    const [buttonPosition, setButtonPosition] = useState({ left: 0, top: 0 });

    const autoResize = (el: HTMLTextAreaElement) => {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    const handleTextSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        const selection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);

        if (selection && selection.trim().length > 0) {
            setSelectedText(selection);

            // Position button fixed near the selection
            const rect = textarea.getBoundingClientRect();

            setButtonPosition({ left: rect.left + 10, top: rect.top - 40 });

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
            <tr className="border-gray-100 border-b transition-colors duration-150 ease-in-out hover:bg-gray-50">
                <td className="w-32 px-2 py-3 text-center align-top text-gray-600 text-xs">
                    {[data.from, data.to].filter(Boolean).join('-')}
                </td>
                <td className="relative px-4 py-3 align-top" dir="rtl">
                    <Textarea
                        className="min-h-[60px] w-full resize-none overflow-hidden border-none bg-transparent p-2 text-right font-arabic text-gray-800 text-lg leading-relaxed shadow-none focus:outline-none focus:ring-0"
                        defaultValue={data.nass ?? ''}
                        key={`${data.id}/${data.lastUpdatedAt}/nass`}
                        onBlur={(e) => {
                            if (e.target.value !== (data.nass ?? '')) {
                                autoResize(e.currentTarget);
                                onUpdate(data.id, { nass: e.target.value });
                            }
                            // Hide button when textarea loses focus (with delay for button click)
                            setTimeout(() => setShowExtractButton(false), 200);
                        }}
                        onMouseUp={handleTextSelect}
                        onSelect={handleTextSelect}
                        placeholder="النص العربي..."
                        ref={(el) => {
                            if (el) {
                                autoResize(el);
                            }
                        }}
                    />
                </td>
                <td className="px-4 py-3 align-top">
                    <Textarea
                        className="min-h-[60px] w-full resize-none overflow-hidden border-none bg-transparent p-2 text-gray-700 text-sm leading-relaxed shadow-none focus:outline-none focus:ring-0"
                        defaultValue={data.text ?? ''}
                        key={`${data.id}/${data.lastUpdatedAt}/text`}
                        onBlur={(e) => {
                            if (e.target.value !== (data.text ?? '')) {
                                autoResize(e.currentTarget);
                                onUpdate(data.id, { text: e.target.value });
                            }
                        }}
                        placeholder="Translation..."
                        ref={(el) => {
                            if (el) {
                                autoResize(el);
                            }
                        }}
                    />
                </td>
                <td className="w-16 px-2 py-3 text-center align-top">
                    <Button
                        aria-label={`Delete excerpt ${data.id}`}
                        onClick={() => onDelete(data.id)}
                        size="sm"
                        variant="ghost"
                    >
                        <Trash2Icon className="h-4 w-4 text-red-500" />
                    </Button>
                </td>
            </tr>
            {floatingButton}
        </>
    );
}

export default React.memo(ExcerptRow);
