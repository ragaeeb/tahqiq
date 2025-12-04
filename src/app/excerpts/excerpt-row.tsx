'use client';

import { Trash2Icon } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Entry } from '@/stores/excerptsStore/types';

type ExcerptRowProps = {
    data: Entry;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Omit<Entry, 'id'>>) => void;
};

function ExcerptRow({ data, onDelete, onUpdate }: ExcerptRowProps) {
    const autoResize = (el: HTMLTextAreaElement) => {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    return (
        <tr className="border-gray-100 border-b transition-colors duration-150 ease-in-out hover:bg-gray-50">
            <td className="w-32 px-2 py-3 text-center align-top text-gray-600 text-xs">
                {[data.from, data.to].filter(Boolean).join('-')}
            </td>
            <td className="px-4 py-3 align-top" dir="rtl">
                <Textarea
                    className="min-h-[60px] w-full resize-none overflow-hidden border-none bg-transparent p-2 text-right font-arabic text-gray-800 text-lg leading-relaxed shadow-none focus:outline-none focus:ring-0"
                    defaultValue={data.arabic ?? ''}
                    key={`${data.id}/${data.lastUpdatedAt}/arabic`}
                    onBlur={(e) => {
                        if (e.target.value !== (data.arabic ?? '')) {
                            autoResize(e.currentTarget);
                            onUpdate(data.id, { arabic: e.target.value });
                        }
                    }}
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
                    defaultValue={data.translation ?? ''}
                    key={`${data.id}/${data.lastUpdatedAt}/translation`}
                    onBlur={(e) => {
                        if (e.target.value !== (data.translation ?? '')) {
                            autoResize(e.currentTarget);
                            onUpdate(data.id, { translation: e.target.value });
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
    );
}

export default React.memo(ExcerptRow);
