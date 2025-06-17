import type { Dispatch, SetStateAction } from 'react';

import type { SheetLine } from '@/stores/manuscriptStore/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parsePageRanges } from '@/lib/textUtils';

type ManuscriptTableHeaderProps = {
    honorifics: [boolean, Dispatch<SetStateAction<boolean>>];
    pagesFilter: [number[], Dispatch<SetStateAction<number[]>>];
    rows: SheetLine[];
};

export default function ManuscriptTableHeader({
    honorifics: [isHonorificsRowsOn, setIsHonorificsRowsOn],
    pagesFilter: [, setFilterByPages],
    rows,
}: ManuscriptTableHeaderProps) {
    const altCount = rows.filter((r) => r.alt).length;

    return (
        <tr>
            <th
                aria-label="Page"
                className="w-20 px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide"
            >
                <Input
                    className={`w-full !text-xl text-xs! leading-relaxed text-gray-800 bg-transparent border-none outline-none focus:bg-gray-50 focus:rounded px-1 py-1 transition-colors duration-150`}
                    onBlur={(e) => {
                        setFilterByPages((prev) => {
                            if (!e.target.value) {
                                return [];
                            }

                            const pageRanges = parsePageRanges(e.target.value);

                            if (pageRanges.toString() !== prev.toString()) {
                                return pageRanges;
                            }

                            return prev;
                        });
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
                            const pages = new Set(rows.filter((r) => !r.alt).map((r) => r.page));
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
    );
}
