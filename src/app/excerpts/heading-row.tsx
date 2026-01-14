'use client';

import { Trash2Icon } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { autoResizeTextarea } from '@/lib/domUtils';
import type { Heading } from '@/stores/excerptsStore/types';

type HeadingRowProps = {
    data: Heading;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Omit<Heading, 'id'>>) => void;
};

function HeadingRow({ data, onDelete, onUpdate }: HeadingRowProps) {
    return (
        <tr className="border-gray-100 border-b transition-colors duration-150 ease-in-out hover:bg-gray-50">
            <td className="w-20 px-1 py-1 text-center align-middle font-mono text-gray-500 text-xs">{data.id}</td>
            <td className="w-24 px-1 py-1 text-center align-middle text-gray-700 text-sm">
                <Input
                    className="border-none bg-transparent text-center shadow-none focus:outline-none focus:ring-0"
                    defaultValue={data.from.toString()}
                    key={`${data.id}/${data.lastUpdatedAt}/from`}
                    min={1}
                    onBlur={(e) => {
                        const value = Number.parseInt(e.target.value, 10);
                        if (!Number.isNaN(value) && value !== data.from) {
                            onUpdate(data.id, { from: value });
                        }
                    }}
                    type="number"
                />
            </td>
            <td className="w-24 px-1 py-1 text-center align-middle text-gray-700 text-sm">
                <Input
                    className="border-none bg-transparent text-center shadow-none focus:outline-none focus:ring-0"
                    defaultValue={data.parent ?? ''}
                    key={`${data.id}/${data.lastUpdatedAt}/parent`}
                    onBlur={(e) => {
                        const value = e.target.value || undefined;
                        if (value !== data.parent) {
                            onUpdate(data.id, { parent: value });
                        }
                    }}
                    placeholder="Parent ID"
                />
            </td>
            <td className="px-2 py-1 align-top" dir="rtl">
                <Textarea
                    className="min-h-[60px] w-full resize-none overflow-hidden border-none bg-transparent p-2 text-right font-arabic text-gray-800 text-lg leading-relaxed shadow-none focus:outline-none focus:ring-0"
                    defaultValue={data.nass}
                    key={`${data.id}/${data.lastUpdatedAt}/nass`}
                    onBlur={(e) => {
                        if (e.target.value !== data.nass) {
                            autoResizeTextarea(e.currentTarget);
                            onUpdate(data.id, { nass: e.target.value });
                        }
                    }}
                    placeholder="عنوان..."
                    ref={autoResizeTextarea}
                />
            </td>
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
                    placeholder="Heading translation..."
                    ref={autoResizeTextarea}
                />
            </td>
            <td className="w-16 px-1 py-1 text-center align-top">
                <Button
                    aria-label={`Delete heading ${data.id}`}
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

export default React.memo(HeadingRow);
