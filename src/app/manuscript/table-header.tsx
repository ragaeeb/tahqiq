import type { Dispatch, SetStateAction } from 'react';

import type { SheetLine } from '@/stores/manuscriptStore/types';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { SWS_SYMBOL } from '@/lib/constants';
import { parsePageRanges } from '@/lib/textUtils';

type ManuscriptTableHeaderProps = {
    honorifics: [boolean, Dispatch<SetStateAction<boolean>>];
    onSelectAll: (selected: boolean) => void;
    pagesFilter: [number[], Dispatch<SetStateAction<number[]>>];
    rows: SheetLine[];
    selectedRows: SheetLine[];
};

export default function ManuscriptTableHeader({
    honorifics: [isHonorificsRowsOn, setIsHonorificsRowsOn],
    onSelectAll,
    pagesFilter: [, setFilterByPages],
    rows,
    selectedRows,
}: ManuscriptTableHeaderProps) {
    const altCount = rows.filter((r) => r.alt).length;
    const isAllSelected = rows.length > 0 && selectedRows.length === rows.length;

    return (
        <tr>
            <th
                aria-label="Select All"
                className="w-12 px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide"
            >
                <Checkbox checked={isAllSelected} onCheckedChange={(checked) => onSelectAll(Boolean(checked))} />
            </th>
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
                    {altCount !== rows.length && (
                        <Button
                            aria-label="Filter Misaligned Observations"
                            className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-bold"
                            onClick={() => {
                                const pages = new Set(rows.filter((r) => !r.alt).map((r) => r.page));
                                setFilterByPages([...pages]);
                            }}
                            variant="destructive"
                        >
                            ✗
                        </Button>
                    )}
                    <Button
                        aria-label="Fix Typos"
                        className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-bold"
                        onClick={() => {
                            setIsHonorificsRowsOn((prev) => !prev);
                        }}
                        variant={isHonorificsRowsOn ? 'outline' : 'ghost'}
                    >
                        {SWS_SYMBOL}
                    </Button>
                    <Button
                        aria-label="Poetic"
                        onClick={() => {
                            const pages = new Set(rows.filter((r) => r.isPoetic).map((r) => r.page));
                            setFilterByPages([...pages]);
                        }}
                    >
                        Poetic
                    </Button>
                    <Button
                        aria-label="Invalid Footnotes"
                        onClick={() => {
                            const pages = new Set(rows.filter((r) => r.hasInvalidFootnotes).map((r) => r.page));
                            setFilterByPages([...pages]);
                        }}
                        variant="outline"
                    >
                        ()
                    </Button>
                    <div className="text-right">Support ({altCount})</div>
                </div>
            </th>
        </tr>
    );
}
