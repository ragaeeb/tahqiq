import Link from 'next/link';
import React from 'react';

import { Textarea } from '@/components/ui/textarea';
import { autoResizeTextarea } from '@/lib/domUtils';
import type { WebPage } from '@/stores/webStore/types';

type PageRowProps = { data: WebPage; urlPattern: string };

function PageRow({ data, urlPattern }: PageRowProps) {
    // Build external link using urlPattern
    const externalUrl = urlPattern.replace('{{page}}', data.id.toString());

    return (
        <tr className="border-gray-100 border-b transition-colors duration-150 ease-in-out hover:bg-gray-50">
            <td className="w-24 px-2 py-3 text-center align-top text-gray-600 text-xs">
                <Link
                    className="text-blue-600 underline hover:text-blue-800"
                    href={externalUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {data.id}
                </Link>
            </td>
            <td className="px-4 py-3 align-top" dir="rtl">
                <Textarea
                    className="web-content min-h-[60px] w-full resize-none overflow-hidden whitespace-pre-wrap border-none bg-transparent p-2 text-right font-arabic text-gray-800 text-lg leading-relaxed shadow-none focus:outline-none focus:ring-0"
                    dir="rtl"
                    key={data.id.toString()}
                    defaultValue={data.content}
                />
                {data.metadata?.footnotes && (
                    <>
                        <hr className="my-2 border-gray-300" />
                        <Textarea
                            className="min-h-[40px] w-full resize-none overflow-hidden border-none bg-transparent p-2 text-right font-arabic text-gray-600 text-sm leading-relaxed shadow-none focus:outline-none focus:ring-0"
                            defaultValue={data.metadata.footnotes}
                            key={data.id.toString()}
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
