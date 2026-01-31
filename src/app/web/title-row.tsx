'use client';

import type { Page } from 'flappa-doormal';
import React, { useCallback } from 'react';
import { Input } from '@/components/ui/input';

type TitleRowProps = { data: Page; onNavigateToPage: (pageId: number) => void };

function TitleRow({ data, onNavigateToPage }: TitleRowProps) {
    const handlePageClick = useCallback(() => {
        onNavigateToPage(data.id);
    }, [data.id, onNavigateToPage]);

    return (
        <tr className="border-gray-100 border-b transition-colors duration-150 ease-in-out hover:bg-gray-50">
            <td className="w-24 px-2 py-3 text-center align-middle text-gray-600 text-xs">
                <button
                    aria-label={`Navigate to page ${data.id}`}
                    className="cursor-pointer text-blue-600 underline hover:text-blue-800"
                    onClick={handlePageClick}
                    title={`Go to page ${data.id}`}
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
                    key={data.id.toString()}
                />
            </td>
        </tr>
    );
}

export default React.memo(TitleRow);
