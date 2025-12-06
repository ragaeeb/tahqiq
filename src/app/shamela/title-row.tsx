'use client';

import Link from 'next/link';
import React from 'react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { autoResizeTextarea } from '@/lib/domUtils';
import type { ShamelaTitle } from '@/stores/shamelaStore/types';

type TitleRowProps = {
    data: ShamelaTitle;
    onUpdate: (id: number, updates: Partial<Omit<ShamelaTitle, 'id'>>) => void;
    shamelaId?: number;
};

function TitleRow({ data, onUpdate, shamelaId }: TitleRowProps) {
    // Build shamela.ws link if shamelaId is available
    // For titles, we link to the page where the title appears
    const shamelaLink = shamelaId ? `https://shamela.ws/book/${shamelaId}/${data.page}#toc-${data.id}` : null;

    return (
        <tr className="border-gray-100 border-b transition-colors duration-150 ease-in-out hover:bg-gray-50">
            <td className="w-24 px-2 py-3 text-center align-middle text-gray-600 text-xs">
                {shamelaLink ? (
                    <Link
                        className="text-blue-600 underline hover:text-blue-800"
                        href={shamelaLink}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        {data.id}
                    </Link>
                ) : (
                    data.id
                )}
            </td>
            <td className="w-24 px-2 py-3 text-center align-middle text-gray-700 text-sm">
                <Input
                    className="border-none bg-transparent text-center shadow-none focus:outline-none focus:ring-0"
                    defaultValue={data.page.toString()}
                    key={`${data.id}/${data.lastUpdatedAt}/page`}
                    min={1}
                    onBlur={(e) => {
                        const value = Number.parseInt(e.target.value, 10);
                        if (!Number.isNaN(value) && value !== data.page) {
                            onUpdate(data.id, { page: value });
                        }
                    }}
                    type="number"
                />
            </td>
            <td className="w-24 px-2 py-3 text-center align-middle text-gray-700 text-sm">
                <Input
                    className="border-none bg-transparent text-center shadow-none focus:outline-none focus:ring-0"
                    defaultValue={data.parent?.toString() ?? ''}
                    key={`${data.id}/${data.lastUpdatedAt}/parent`}
                    onBlur={(e) => {
                        const value = e.target.value ? Number.parseInt(e.target.value, 10) : undefined;
                        if (value !== data.parent) {
                            onUpdate(data.id, { parent: value });
                        }
                    }}
                    placeholder="Parent ID"
                    type="number"
                />
            </td>
            <td className="px-4 py-3 align-top" dir="rtl">
                <Textarea
                    className="min-h-[60px] w-full resize-none overflow-hidden border-none bg-transparent p-2 text-right font-arabic text-gray-800 text-lg leading-relaxed shadow-none focus:outline-none focus:ring-0"
                    defaultValue={data.content}
                    key={`${data.id}/${data.lastUpdatedAt}/content`}
                    onBlur={(e) => {
                        // Always resize on blur for consistency
                        autoResizeTextarea(e.currentTarget);
                        if (e.target.value !== data.content) {
                            onUpdate(data.id, { content: e.target.value });
                        }
                    }}
                    placeholder="عنوان..."
                    ref={(el) => {
                        if (el) {
                            autoResizeTextarea(el);
                        }
                    }}
                />
            </td>
        </tr>
    );
}

export default React.memo(TitleRow);
