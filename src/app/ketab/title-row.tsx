'use client';

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { KetabTitle } from '@/stores/ketabStore/types';

type TitleRowProps = {
    data: KetabTitle;
    allTitles: KetabTitle[];
    onUpdate: (id: number, updates: Partial<Omit<KetabTitle, 'id'>>) => void;
    onNavigateToPage: (pageId: number) => void;
    bookId?: number;
};

function TitleRow({ data, onUpdate, onNavigateToPage }: TitleRowProps) {
    const handleTitleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            const newTitle = e.target.value;
            if (newTitle !== data.title) {
                onUpdate(data.id, { title: newTitle });
            }
        },
        [data.id, data.title, onUpdate],
    );

    const handlePageClick = useCallback(() => {
        onNavigateToPage(data.page);
    }, [data.page, onNavigateToPage]);

    // Indentation based on depth
    const indentPadding = data.depth * 20;

    return (
        <tr className="border-gray-100 border-b transition-colors duration-150 ease-in-out hover:bg-gray-50">
            <td className="w-24 px-2 py-3 text-center align-middle text-gray-600 text-xs">
                <Button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={handlePageClick}
                    size="sm"
                    variant="link"
                >
                    {data.page}
                </Button>
            </td>
            <td className="w-24 px-2 py-3 text-center align-middle text-gray-500 text-xs">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 text-xs">L{data.title_level}</span>
            </td>
            <td className="px-4 py-3 align-middle" dir="rtl">
                <div style={{ paddingRight: `${indentPadding}px` }}>
                    <Input
                        className="w-full border-none bg-transparent text-right font-arabic text-gray-800 text-lg"
                        defaultValue={data.title}
                        dir="rtl"
                        onBlur={handleTitleBlur}
                    />
                </div>
            </td>
        </tr>
    );
}

export default React.memo(TitleRow);
