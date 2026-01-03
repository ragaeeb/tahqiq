'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useRef } from 'react';

import EditableHTML from '@/components/editable-html';
import { Textarea } from '@/components/ui/textarea';
import { autoResizeTextarea } from '@/lib/domUtils';
import type { WebPage } from '@/stores/webStore/types';

type PageRowProps = {
    data: WebPage;
    onUpdate: (id: number, updates: Partial<Omit<WebPage, 'id'>>) => void;
    urlPattern?: string;
};

/**
 * Build external URL by substituting {{page}} in the pattern with the page id
 */
function buildExternalUrl(urlPattern: string | undefined, pageId: number): string | null {
    if (!urlPattern) {
        return null;
    }
    return urlPattern.replace('{{page}}', pageId.toString());
}

function PageRow({ data, onUpdate, urlPattern }: PageRowProps) {
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

    // Build external link using urlPattern
    const externalUrl = buildExternalUrl(urlPattern, data.id);

    return (
        <tr className="border-gray-100 border-b transition-colors duration-150 ease-in-out hover:bg-gray-50">
            <td className="w-24 px-2 py-3 text-center align-top text-gray-600 text-xs">
                {externalUrl ? (
                    <Link
                        className="text-blue-600 underline hover:text-blue-800"
                        href={externalUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        {data.id}
                    </Link>
                ) : (
                    data.id
                )}
            </td>
            <td className="px-4 py-3 align-top" dir="rtl">
                <EditableHTML
                    className="web-content min-h-[60px] w-full resize-none overflow-hidden whitespace-pre-wrap border-none bg-transparent p-2 text-right font-arabic text-gray-800 text-lg leading-relaxed shadow-none focus:outline-none focus:ring-0"
                    dir="rtl"
                    html={data.body}
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
                            onBlur={handleFootnoteBlur}
                            onInput={(e) => {
                                handleFootnoteChange({ target: { value: e.currentTarget.value } });
                                autoResizeTextarea(e.currentTarget);
                            }}
                            placeholder="الحاشية..."
                            ref={autoResizeTextarea}
                        />
                    </>
                )}
            </td>
        </tr>
    );
}

export default React.memo(PageRow);
