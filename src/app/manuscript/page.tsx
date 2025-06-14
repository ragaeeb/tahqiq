'use client';

import { useMemo } from 'react';

import type { RawInputFiles } from '@/stores/manuscriptStore/types';

import BookToolbar from '@/components/book-toolbar';
import JsonDropZone from '@/components/json-drop-zone';
import VersionFooter from '@/components/version-footer';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

/**
 * Renders the main page layout for displaying manuscript pages.
 */
export default function Book() {
    const initManuscript = useManuscriptStore((state) => state.init);
    const sheets = useManuscriptStore((state) => state.sheets);
    const isInitialized = sheets.length > 0;

    const rows = useMemo(() => {
        return sheets.flatMap((sheet) =>
            sheet.observations.map((o, i) => {
                return {
                    text: o.text,
                    ...(sheet.alternateObservations![i] && { alt: sheet.alternateObservations![i].text }),
                    page: sheet.page,
                };
            }),
        );
    }, [sheets]);

    if (!isInitialized) {
        return (
            <>
                <div className="min-h-screen flex flex-col p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                    <div className="flex flex-col w-full max-w">
                        <JsonDropZone
                            allowedExtensions=".json,.txt"
                            description="Drag and drop the manuscript"
                            maxFiles={4}
                            onFiles={(map) => initManuscript(map as unknown as RawInputFiles)}
                        />
                    </div>
                </div>
                <VersionFooter />
            </>
        );
    }

    return (
        <>
            <div className="min-h-screen flex flex-col p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                <div className="flex flex-col w-full max-w">
                    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                        <BookToolbar />
                    </div>

                    <div className="overflow-auto border rounded">
                        <table className="w-full table-auto divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th aria-label="Page" className="px-2 py-1 w-36 text-left">
                                        Page
                                    </th>
                                    <th aria-label="Text" className="px-2 py-1 w-8 text-left">
                                        Text
                                    </th>
                                    <th aria-label="Support" className="px-4 py-1 text-right">
                                        Support
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {rows.map((r, i) => (
                                    <tr className="px-2 py-1 space-y-1 text-xl align-top" key={r.page + '/' + i}>
                                        <td aria-label="Page" className="px-2 py-1 w-36 text-left">
                                            {r.page}
                                        </td>
                                        <td aria-label="Text" className="px-2 text-xl py-1 w-full text-right" dir="rtl">
                                            {r.text}
                                        </td>
                                        <td
                                            aria-label="Support"
                                            className={`px-4 text-xl py-1 w-full text-right ${!r.alt && 'bg-red-100'}`}
                                            dir="rtl"
                                        >
                                            {r.alt || 'X'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <VersionFooter />
        </>
    );
}
