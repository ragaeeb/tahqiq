'use client';

import Link from 'next/link';
import React from 'react';

import { Textarea } from '@/components/ui/textarea';
import { autoResizeTextarea } from '@/lib/domUtils';
import type { ShamelaTitle } from '@/stores/shamelaStore/types';

type TitleRowProps = {
    allTitles: ShamelaTitle[];
    data: ShamelaTitle;
    onNavigateToPage: (pageId: number) => void;
    onUpdate: (id: number, updates: Partial<Omit<ShamelaTitle, 'id'>>) => void;
    shamelaId?: number;
};

function TitleRow({ allTitles, data, onNavigateToPage, onUpdate, shamelaId }: TitleRowProps) {
    // Build shamela.ws link if shamelaId is available
    // For titles, we link to the page where the title appears
    const shamelaLink = shamelaId ? `https://shamela.ws/book/${shamelaId}/${data.page}#toc-${data.id}` : null;

    const handleParentClick = () => {
        if (data.parent) {
            // Find the parent title and navigate to its page
            const parentTitle = allTitles.find((t) => t.id === data.parent);
            if (parentTitle) {
                onNavigateToPage(parentTitle.page);
            }
        }
    };

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
                <button
                    aria-label={`Navigate to page ${data.page}`}
                    className="cursor-pointer text-blue-600 underline hover:text-blue-800"
                    onClick={() => onNavigateToPage(data.page)}
                    title={`Go to page ${data.page}`}
                    type="button"
                >
                    {data.page}
                </button>
            </td>
            <td className="w-24 px-2 py-3 text-center align-middle text-gray-700 text-sm">
                {data.parent ? (
                    <button
                        className="cursor-pointer text-blue-600 underline hover:text-blue-800"
                        onClick={handleParentClick}
                        title={`Go to parent title ${data.parent}'s page`}
                        type="button"
                    >
                        {data.parent}
                    </button>
                ) : (
                    <span className="text-gray-400">—</span>
                )}
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
