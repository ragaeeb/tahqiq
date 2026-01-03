'use client';

import React, { useCallback } from 'react';

import { Input } from '@/components/ui/input';
import type { WebTitle } from '@/stores/webStore/types';

type TitleRowProps = {
    data: WebTitle;
    onNavigateToPage: (pageId: number) => void;
    onUpdate: (id: number, updates: Partial<Omit<WebTitle, 'id'>>) => void;
};

function TitleRow({ data, onNavigateToPage, onUpdate }: TitleRowProps) {
    const handleTitleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            const newContent = e.target.value;
            if (newContent !== data.content) {
                onUpdate(data.id, { content: newContent });
            }
        },
        [data.id, data.content, onUpdate],
    );

    const handlePageClick = useCallback(() => {
        onNavigateToPage(data.page);
    }, [data.page, onNavigateToPage]);

    return (
        <tr className="border-gray-100 border-b transition-colors duration-150 ease-in-out hover:bg-gray-50">
            <td className="w-24 px-2 py-3 text-center align-middle text-gray-600 text-xs">
                <button
                    aria-label={`Navigate to page ${data.page}`}
                    className="cursor-pointer text-blue-600 underline hover:text-blue-800"
                    onClick={handlePageClick}
                    title={`Go to page ${data.page}`}
                    type="button"
                >
                    {data.id}
                </button>
            </td>
            <td className="px-4 py-3 align-middle" dir="rtl">
                <Input
                    className="w-full border-none bg-transparent text-right font-arabic text-gray-800 text-lg"
                    defaultValue={data.content}
                    dir="rtl"
                    key={`${data.id}/${data.lastUpdatedAt}/content`}
                    onBlur={handleTitleBlur}
                />
            </td>
        </tr>
    );
}

export default React.memo(TitleRow);
