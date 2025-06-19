import type { Dispatch, SetStateAction } from 'react';

import type { SheetLine } from '@/stores/manuscriptStore/types';

import SubmittableInput from '@/components/submittable-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { AZW_SYMBOL, SWS_SYMBOL } from '@/lib/constants';
import { parsePageRanges } from '@/lib/textUtils';

type ManuscriptTableHeaderProps = {
    idsFilter: [number[], Dispatch<SetStateAction<number[]>>];
    onSelectAll: (selected: boolean) => void;
    rows: SheetLine[];
    selection: [SheetLine[], Dispatch<SetStateAction<SheetLine[]>>];
};

export default function ManuscriptTableHeader({
    idsFilter: [, setFilterByIds],
    onSelectAll,
    rows,
    selection: [selectedRows],
}: ManuscriptTableHeaderProps) {
    const altCount = rows.filter((r) => r.alt).length;
    const isAllSelected = rows.length > 0 && selectedRows.length === rows.length;
    const hasHonorifcsApplied = rows.some((o) => o.text.includes(SWS_SYMBOL));
    const hasMissingHonorifics = rows.some((o) => o.includesHonorifics);
    const includesPoetry = rows.some((o) => o.isPoetic);
    const hasInvalidFootnotes = rows.some((o) => o.hasInvalidFootnotes);

    const filterByPages = (rows: SheetLine[]) => {
        const pages = new Set(rows.map((r) => r.page));
        setFilterByIds(rows.filter((r) => pages.has(r.page)).map((r) => r.id));
    };

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
                <SubmittableInput
                    className={`w-full !text-xl text-xs! leading-relaxed text-gray-800 bg-transparent border-none outline-none focus:bg-gray-50 focus:rounded px-1 py-1 transition-colors duration-150`}
                    name="range"
                    onSubmit={(range) => {
                        const pages = new Set(parsePageRanges(range));
                        setFilterByIds(rows.filter((r) => pages.has(r.page)).map((r) => r.id));
                    }}
                    placeholder="Page"
                />
            </th>
            <th
                aria-label="Text"
                className="w-1/2 px-4 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wide"
                dir="rtl"
            >
                <SubmittableInput
                    className={`w-full !text-xl leading-relaxed text-gray-800 bg-transparent border-none outline-none focus:bg-gray-50 focus:rounded px-1 py-1 transition-colors duration-150`}
                    name="query"
                    onSubmit={(query) => {
                        setFilterByIds(rows.filter((r) => r.text.includes(query)).map((r) => r.id));
                    }}
                    placeholder={`Text (${rows.length})`}
                />
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
                                filterByPages(rows.filter((r) => !r.alt));
                            }}
                            variant="destructive"
                        >
                            ✗
                        </Button>
                    )}
                    {hasMissingHonorifics && (
                        <Button
                            aria-label="Fix Typos"
                            className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-bold"
                            onClick={() => {
                                setFilterByIds(rows.filter((r) => r.includesHonorifics).map((r) => r.id));
                            }}
                            variant="ghost"
                        >
                            {SWS_SYMBOL}
                        </Button>
                    )}
                    {hasHonorifcsApplied && (
                        <Button
                            aria-label="Correct Wrong Honorifics"
                            className="flex items-center justify-center w-6 h-6 hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none font-bold"
                            onClick={() => {
                                setFilterByIds(rows.filter((r) => r.text.includes(SWS_SYMBOL)).map((r) => r.id));
                            }}
                            variant="ghost"
                        >
                            {AZW_SYMBOL}
                        </Button>
                    )}
                    {includesPoetry && (
                        <Button
                            aria-label="Poetic"
                            onClick={() => {
                                filterByPages(rows.filter((r) => r.isPoetic));
                            }}
                        >
                            Poetic
                        </Button>
                    )}
                    {hasInvalidFootnotes && (
                        <Button
                            aria-label="Invalid Footnotes"
                            onClick={() => {
                                filterByPages(rows.filter((r) => r.hasInvalidFootnotes));
                            }}
                            variant="outline"
                        >
                            ()
                        </Button>
                    )}
                    <div className="text-right">Support ({altCount})</div>
                </div>
            </th>
        </tr>
    );
}
