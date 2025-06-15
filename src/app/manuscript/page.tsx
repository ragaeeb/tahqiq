'use client';

import { areSimilarAfterNormalization } from 'kokokor';
import { useMemo, useState } from 'react';

import type { RawInputFiles } from '@/stores/manuscriptStore/types';

import JsonDropZone from '@/components/json-drop-zone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import VersionFooter from '@/components/version-footer';
import { parsePageRanges } from '@/lib/textUtils';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

import Toolbar from './toolbar';

/**
 * Renders the main page layout for displaying manuscript pages.
 */
export default function Manuscript() {
    const initManuscript = useManuscriptStore((state) => state.init);
    const splitAltAtLineBreak = useManuscriptStore((state) => state.splitAltAtLineBreak);
    const mergeWithAbove = useManuscriptStore((state) => state.mergeWithAbove);
    const sheets = useManuscriptStore((state) => state.sheets);
    const isInitialized = sheets.length > 0;
    const [filterByPages, setFilterByPages] = useState<number[]>([]);
    const [isHonorificsRowsOn, setIsHonorificsRowsOn] = useState(false);

    const rows = useMemo(() => {
        return sheets
            .filter((s) => s.observations.length > 0)
            .filter((s) => filterByPages.length === 0 || filterByPages.includes(s.page))
            .flatMap((sheet) =>
                sheet.observations
                    .map((o, i) => {
                        const alt = sheet.alternateObservations![i]?.text;

                        return {
                            alt,
                            hasInvalidFootnotes: Boolean(o.text?.includes('()')),
                            includesHonorifics: Boolean(alt?.includes('ﷺ')),
                            isMerged: Boolean(o.confidence && o.confidence < 1),
                            isSimilar: alt && o.text && areSimilarAfterNormalization(o.text, alt, 0.6),
                            page: sheet.page,
                            text: o.text,
                        };
                    })
                    .filter((s) => s.text)
                    .filter((s) => (isHonorificsRowsOn ? s.includesHonorifics : true)),
            );
    }, [sheets, filterByPages, isHonorificsRowsOn]);

    const altCount = rows.filter((r) => r.alt).length;

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
                    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
                        <Toolbar />
                    </div>

                    <div className="overflow-auto border border-gray-300 rounded-lg shadow-sm">
                        <table className="w-full table-fixed divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th
                                        aria-label="Page"
                                        className="w-20 px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide"
                                    >
                                        <Input
                                            className={`w-full !text-xl text-xs! leading-relaxed text-gray-800 bg-transparent border-none outline-none focus:bg-gray-50 focus:rounded px-1 py-1 transition-colors duration-150`}
                                            onBlur={(e) => {
                                                if (!e.target.value) {
                                                    setFilterByPages([]);
                                                    return;
                                                }

                                                const pageRanges = parsePageRanges(e.target.value);

                                                if (pageRanges.toString() !== filterByPages.toString()) {
                                                    setFilterByPages(pageRanges);
                                                }
                                            }}
                                            placeholder="Page"
                                        />
                                    </th>
                                    <th
                                        aria-label="Text"
                                        className="w-1/2 px-4 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wide"
                                        dir="rtl"
                                    >
                                        Text ({rows.length})
                                    </th>
                                    <th
                                        aria-label="Support"
                                        className="w-1/2 px-4 py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide"
                                        dir="rtl"
                                    >
                                        <div className="flex items-center justify-between">
                                            <Button
                                                aria-label="Support actions"
                                                className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-bold"
                                                onClick={() => {
                                                    const pages = new Set(
                                                        rows.filter((r) => !r.alt).map((r) => r.page),
                                                    );
                                                    setFilterByPages([...pages]);
                                                }}
                                            >
                                                ♻
                                            </Button>
                                            <Button
                                                aria-label="Support actions"
                                                className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-bold"
                                                onClick={() => {
                                                    // TODO: We need to handle ﷻ symbol as well and also false positives for radi Allahu 'anhu and rahimahullah
                                                    setIsHonorificsRowsOn((prev) => !prev);
                                                }}
                                                variant={isHonorificsRowsOn ? 'destructive' : 'ghost'}
                                            >
                                                ﷺ
                                            </Button>
                                            <div className="text-right">Support ({altCount})</div>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {rows.map((r, i) => (
                                    <tr
                                        className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                                        key={r.page + '/' + i}
                                    >
                                        <td
                                            aria-label="Page"
                                            className={`w-20 px-4 py-4 text-left text-sm font-medium text-gray-900 border-r border-gray-100 ${r.hasInvalidFootnotes && 'bg-red-200'}`}
                                        >
                                            {r.page}
                                        </td>
                                        <td
                                            aria-label="Text"
                                            className={`w-1/2 px-4 py-4 text-xl text-right leading-relaxed text-gray-800 border-r border-gray-100 ${r.isMerged && 'bg-red-300'}`}
                                            dir="rtl"
                                        >
                                            <Input
                                                className={`w-full !text-xl text-right leading-relaxed text-gray-800 ${r.includesHonorifics ? 'bg-red-200' : 'bg-transparent'} border-none outline-none focus:bg-gray-50 focus:rounded px-1 py-1 transition-colors duration-150`}
                                                defaultValue={r.text}
                                                dir="rtl"
                                                style={{ fontFamily: 'inherit' }}
                                                type="text"
                                            />
                                        </td>
                                        <td
                                            aria-label="Support"
                                            className={`w-1/2 px-4 py-4 text-xl text-right leading-relaxed ${
                                                r.alt && r.isSimilar
                                                    ? 'text-gray-800 bg-green-50'
                                                    : 'text-red-600 bg-red-50'
                                            } transition-colors duration-150`}
                                            dir="rtl"
                                        >
                                            <div className="flex items-center justify-between">
                                                <Button
                                                    aria-label="Mark as supported"
                                                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-green-200 hover:text-green-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                                                >
                                                    ✓
                                                </Button>
                                                <Button
                                                    aria-label="Merge With Above"
                                                    className="flex items-center justify-center px-2 w-8 h-8 rounded-full hover:bg-green-200 hover:text-green-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                                                    onClick={() => {
                                                        mergeWithAbove(r.page, i);
                                                    }}
                                                    variant="outline"
                                                >
                                                    ↑
                                                </Button>
                                                <Textarea
                                                    className="text-right flex-1 mr-2 !text-xl leading-relaxed bg-transparent border-none outline-none focus:bg-white focus:rounded resize-none overflow-hidden min-h-[1.5em] px-1 py-1 transition-colors duration-150"
                                                    dir="rtl"
                                                    onChange={(e) => {
                                                        if (e.target.value !== r.alt) {
                                                            splitAltAtLineBreak(r.page, i, e.target.value);
                                                        }
                                                    }}
                                                    onInput={(e) => {
                                                        const target = e.target as HTMLTextAreaElement;
                                                        target.style.height = 'auto';
                                                        target.style.height = target.scrollHeight + 'px';
                                                    }}
                                                    placeholder="✗"
                                                    rows={1}
                                                    style={{ fontFamily: 'inherit' }}
                                                    value={r.alt || ''}
                                                />
                                            </div>
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
