'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useRef } from 'react';
import { normalizeHtml } from 'shamela/content';

import EditableHTML from '@/components/editable-html';
import { Textarea } from '@/components/ui/textarea';
import { autoResizeTextarea } from '@/lib/domUtils';
import type { ShamelaPage } from '@/stores/shamelaStore/types';

type PageRowProps = {
    data: ShamelaPage;
    onUpdate: (id: number, updates: Partial<Omit<ShamelaPage, 'id'>>) => void;
    shamelaId?: number;
};

/**
 * Regex pattern to detect title markers in page content.
 * More robust than string.includes() as it matches the exact attribute pattern.
 * Matches both double and single quoted data-type="title" or data-type='title'.
 */
const TITLE_MARKER_PATTERN = /data-type=["']title["']/;

function PageRow({ data, onUpdate, shamelaId }: PageRowProps) {
    const bodyRef = useRef<string>(data.body);
    const originalBodyRef = useRef<string>(data.body);
    const originalFootnoteRef = useRef<string | undefined>(data.footnote);

    useEffect(() => {
        bodyRef.current = data.body;
        originalBodyRef.current = data.body;
        originalFootnoteRef.current = data.footnote;
    }, [data.body, data.footnote]);

    const handleBodyChange = useCallback((evt: { target: { value: string } }) => {
        bodyRef.current = evt.target.value;
    }, []);

    const handleBodyBlur = useCallback(() => {
        if (bodyRef.current !== data.body) {
            // Update the original ref for future patches
            originalBodyRef.current = bodyRef.current;
            onUpdate(data.id, { body: bodyRef.current });
        }
    }, [data.body, data.id, onUpdate]);

    // Check if this page contains any title spans using regex for robustness
    const hasTitles = TITLE_MARKER_PATTERN.test(data.body);

    // Build shamela.ws link if shamelaId is available
    const shamelaLink = shamelaId ? `https://shamela.ws/book/${shamelaId}/${data.id}` : null;

    // Sanitize and normalize HTML before rendering to prevent XSS
    // normalizeHtml handles formatting
    const safeHtml = normalizeHtml(data.body);

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
                    html={safeHtml}
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
                                // Always resize on blur for consistency
                                autoResizeTextarea(e.currentTarget);
                                if (e.target.value !== (data.footnote ?? '')) {
                                    // Update the original ref for future patches
                                    originalFootnoteRef.current = e.target.value;
                                    onUpdate(data.id, { footnote: e.target.value });
                                }
                            }}
                            onInput={(e) => {
                                // Resize as user types for responsive height adjustment
                                autoResizeTextarea(e.currentTarget);
                            }}
                            placeholder="الحواشي..."
                            ref={autoResizeTextarea}
                        />
                    </>
                )}
            </td>
        </tr>
    );
}

export default React.memo(PageRow);
