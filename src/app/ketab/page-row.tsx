'use client';

import React, { useCallback, useEffect, useRef } from 'react';

import EditableHTML from '@/components/editable-html';
import type { KetabPage } from '@/stores/ketabStore/types';

type PageRowProps = {
    data: KetabPage;
    onUpdate: (id: number, updates: Partial<Omit<KetabPage, 'id'>>) => void;
    bookId?: number;
};

function PageRow({ data, onUpdate, bookId }: PageRowProps) {
    const bodyRef = useRef<string>(data.body);
    const footnoteRef = useRef<string>(data.footnote || '');

    useEffect(() => {
        bodyRef.current = data.body;
        footnoteRef.current = data.footnote || '';
    }, [data.body, data.footnote]);

    const handleBodyChange = useCallback((evt: { target: { value: string } }) => {
        bodyRef.current = evt.target.value;
    }, []);

    const handleBodyBlur = useCallback(() => {
        if (bodyRef.current !== data.body) {
            onUpdate(data.id, { body: bodyRef.current });
        }
    }, [data.body, data.id, onUpdate]);

    const handleFootnoteChange = useCallback((evt: { target: { value: string } }) => {
        footnoteRef.current = evt.target.value;
    }, []);

    const handleFootnoteBlur = useCallback(() => {
        if (footnoteRef.current !== (data.footnote || '')) {
            onUpdate(data.id, { footnote: footnoteRef.current || undefined });
        }
    }, [data.footnote, data.id, onUpdate]);

    const partName = data.part?.name || '';

    return (
        <tr className="border-gray-100 border-b transition-colors duration-150 ease-in-out hover:bg-gray-50">
            <td className="w-24 px-2 py-3 text-center align-top text-gray-600 text-xs">{data.page}</td>
            <td className="w-32 px-2 py-3 text-center align-top text-gray-500 text-xs">{partName || '—'}</td>
            <td className="px-4 py-3 align-top" dir="rtl">
                <EditableHTML
                    className="ketab-content min-h-[60px] w-full resize-none overflow-hidden border-none bg-transparent p-2 text-right font-arabic text-gray-800 text-lg leading-relaxed shadow-none focus:outline-none focus:ring-0"
                    dir="rtl"
                    html={data.body}
                    key={`${data.id}/${data.lastUpdatedAt}/body`}
                    onBlur={handleBodyBlur}
                    onChange={handleBodyChange}
                />
                {data.footnote && (
                    <>
                        <hr className="my-2 border-gray-300" />
                        <EditableHTML
                            className="ketab-footnote min-h-[40px] w-full resize-none overflow-hidden border-none bg-transparent p-2 text-right font-arabic text-gray-600 text-sm leading-relaxed shadow-none focus:outline-none focus:ring-0"
                            dir="rtl"
                            html={data.footnote}
                            key={`${data.id}/${data.lastUpdatedAt}/footnote`}
                            onBlur={handleFootnoteBlur}
                            onChange={handleFootnoteChange}
                        />
                    </>
                )}
            </td>
        </tr>
    );
}

export default React.memo(PageRow);
