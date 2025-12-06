'use client';

import Link from 'next/link';
import React, { useCallback, useRef } from 'react';
import { normalizeHtml } from 'shamela/content';

import EditableHTML from '@/components/editable-html';
import { Textarea } from '@/components/ui/textarea';
import type { ShamelaPage } from '@/stores/shamelaStore/types';

type PageRowProps = {
    data: ShamelaPage;
    onUpdate: (id: number, updates: Partial<Omit<ShamelaPage, 'id'>>) => void;
    shamelaId?: number;
};

function PageRow({ data, onUpdate, shamelaId }: PageRowProps) {
    const bodyRef = useRef<string>(data.body);

    const autoResize = (el: HTMLTextAreaElement) => {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    const handleBodyChange = useCallback((evt: { target: { value: string } }) => {
        bodyRef.current = evt.target.value;
    }, []);

    const handleBodyBlur = useCallback(() => {
        if (bodyRef.current !== data.body) {
            onUpdate(data.id, { body: bodyRef.current });
        }
    }, [data.body, data.id, onUpdate]);

    // Check if this page contains any title spans
    const hasTitles = data.body.includes('data-type="title"') || data.body.includes("data-type='title'");

    // Build shamela.ws link if shamelaId is available
    const shamelaLink = shamelaId ? `https://shamela.ws/book/${shamelaId}/${data.id}` : null;

    return (
        <tr
            className={`border-gray-100 border-b transition-colors duration-150 ease-in-out hover:bg-gray-50 ${
                hasTitles ? 'border-l-4 border-l-purple-400 bg-purple-50/30' : ''
            }`}
        >
            <td className="w-24 px-2 py-3 text-center align-top text-gray-600 text-xs">
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
            <td className="w-20 px-2 py-3 text-center align-top text-gray-600 text-xs">{data.page}</td>
            <td className="w-32 px-2 py-3 text-center align-top text-gray-500 text-xs">{data.part}</td>
            <td className="px-4 py-3 align-top" dir="rtl">
                <EditableHTML
                    className="shamela-content min-h-[60px] w-full resize-none overflow-hidden border-none bg-transparent p-2 text-right font-arabic text-gray-800 text-lg leading-relaxed shadow-none focus:outline-none focus:ring-0"
                    dir="rtl"
                    html={normalizeHtml(data.body)}
                    key={`${data.id}/${data.lastUpdatedAt}/body`}
                    onBlur={handleBodyBlur}
                    onChange={handleBodyChange}
                />
                {data.footnote && (
                    <>
                        <hr className="my-2 border-gray-300" />
                        <Textarea
                            className="min-h-[40px] w-full resize-none overflow-hidden border-none bg-transparent p-2 text-right font-arabic text-gray-600 text-sm leading-relaxed shadow-none focus:outline-none focus:ring-0"
                            defaultValue={data.footnote}
                            key={`${data.id}/${data.lastUpdatedAt}/footnote`}
                            onBlur={(e) => {
                                if (e.target.value !== (data.footnote ?? '')) {
                                    autoResize(e.currentTarget);
                                    onUpdate(data.id, { footnote: e.target.value });
                                }
                            }}
                            placeholder="الحواشي..."
                            ref={(el) => {
                                if (el) {
                                    autoResize(el);
                                }
                            }}
                        />
                    </>
                )}
            </td>
        </tr>
    );
}

export default React.memo(PageRow);
