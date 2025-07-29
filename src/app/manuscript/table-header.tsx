import type { Dispatch, SetStateAction } from 'react';

import { isArabicTextNoise } from 'baburchi';
import { BookmarkIcon, BracketsIcon, FilterIcon, SignatureIcon, StrikethroughIcon } from 'lucide-react';
import { record } from 'nanolytics';

import type { SheetLine } from '@/stores/manuscriptStore/types';

import SubmittableInput from '@/components/submittable-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AZW_SYMBOL, SWS_SYMBOL } from '@/lib/constants';
import { filterRowsByDivergence } from '@/lib/filtering';
import { createSearchRegex, parsePageRanges } from '@/lib/textUtils';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

type ManuscriptTableHeaderProps = {
    onSelectAll: (selected: boolean) => void;
    rows: SheetLine[];
    selection: [SheetLine[], Dispatch<SetStateAction<SheetLine[]>>];
};

export default function ManuscriptTableHeader({
    onSelectAll,
    rows,
    selection: [selectedRows],
}: ManuscriptTableHeaderProps) {
    const filterByIds = useManuscriptStore((state) => state.filterByIds);
    const filterByPages = useManuscriptStore((state) => state.filterByPages);
    const altCount = rows.filter((r) => r.alt).length;
    const isAllSelected = rows.length > 0 && selectedRows.length === rows.length;
    const hasHonorifcsApplied = rows.some((o) => o.text.includes(SWS_SYMBOL));
    const hasMissingHonorifics = rows.some((o) => o.includesHonorifics);
    const includesPoetry = rows.some((o) => o.isPoetic);
    const hasDivergence = rows.some((o) => !o.isSimilar);
    const hasInvalidFootnotes = rows.some((o) => o.hasInvalidFootnotes);
    const hasHeadings = rows.some((o) => o.isHeading);
    const hasCenteredContent = rows.some((o) => o.isCentered);

    const queryRows = (query: string, property: 'alt' | 'text') => {
        const regex = createSearchRegex(query);
        filterByIds(rows.filter((r) => regex.test(r[property])).map((r) => r.id));
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
                <div className="flex items-center justify-between">
                    <SubmittableInput
                        className={`w-full !text-xl text-xs! leading-relaxed text-gray-800 bg-transparent border-none outline-none focus:bg-gray-50 focus:rounded px-1 py-1 transition-colors duration-150`}
                        name="range"
                        onSubmit={(range) => {
                            record('FilterByPages', range);
                            filterByPages(parsePageRanges(range));
                        }}
                        placeholder="Page"
                    />
                </div>
            </th>
            <th
                aria-label="Text"
                className="w-1/2 px-4 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wide"
                dir="rtl"
            >
                <div className="flex items-center justify-between">
                    <Button
                        aria-label="Filter Misaligned Observations"
                        className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-bold"
                        onClick={() => {
                            record('FilterNoiseInAsl');
                            filterByIds(rows.filter((r) => isArabicTextNoise(r.text)).map((r) => r.id));
                        }}
                        variant="ghost"
                    >
                        <FilterIcon />
                    </Button>
                    {hasCenteredContent && (
                        <Button
                            aria-label="Centered Content"
                            className="flex items-center justify-center w-6 h-6 hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-bold"
                            onClick={() => {
                                record('FilterByCentered');
                                filterByIds(rows.filter((r) => r.isCentered).map((r) => r.id));
                            }}
                            variant="ghost"
                        >
                            ☰
                        </Button>
                    )}
                    {hasHeadings && (
                        <Button
                            aria-label="Headings"
                            className="flex items-center justify-center w-6 h-6 hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-bold"
                            onClick={() => {
                                record('FilterByHeadings');
                                filterByIds(rows.filter((r) => r.isHeading).map((r) => r.id));
                            }}
                            variant="ghost"
                        >
                            <BookmarkIcon />
                        </Button>
                    )}
                    {hasHonorifcsApplied && (
                        <Button
                            aria-label="Correct Wrong Honorifics"
                            className="flex items-center justify-center w-6 h-6 hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none font-bold"
                            onClick={() => {
                                record('FilterByHonorificsInObservation');
                                filterByIds(rows.filter((r) => r.text.includes(SWS_SYMBOL)).map((r) => r.id));
                            }}
                            variant="ghost"
                        >
                            {AZW_SYMBOL}
                        </Button>
                    )}
                    {hasInvalidFootnotes && (
                        <Button
                            aria-label="Invalid Footnotes"
                            className="flex items-center justify-center w-6 h-6 hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none"
                            onClick={() => {
                                record('FilterByInvalidFootnotes');
                                filterByPages(rows.filter((r) => r.hasInvalidFootnotes).map((r) => r.page));
                            }}
                            variant="ghost"
                        >
                            <BracketsIcon />
                        </Button>
                    )}
                    {includesPoetry && (
                        <Button
                            aria-label="Poetic"
                            className="flex items-center justify-center w-6 h-6 hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none font-bold"
                            onClick={() => {
                                record('FilterByPoetic');
                                filterByIds(rows.filter((r) => r.isPoetic).map((r) => r.id));
                            }}
                            variant="ghost"
                        >
                            <SignatureIcon />
                        </Button>
                    )}
                    <div className="text-right w-full">
                        <SubmittableInput
                            className={`w-full !text-xl leading-relaxed text-gray-800 bg-transparent border-none outline-none focus:bg-gray-50 focus:rounded px-1 py-1 transition-colors duration-150`}
                            name="query"
                            onSubmit={(query) => {
                                record('QueryObservations');
                                queryRows(query, 'text');
                            }}
                            placeholder={`Text (${rows.length})`}
                        />
                    </div>
                </div>
            </th>
            <th
                aria-label="Support"
                className="w-1/2 px-4 py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide"
                dir="rtl"
            >
                <div className="flex items-center justify-between">
                    <Button
                        aria-label="Filter Misaligned Observations"
                        className="flex items-center justify-center w-6 h-6 hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-bold"
                        onClick={() => {
                            record('FilterNoiseInSupport');
                            filterByIds(rows.filter((r) => r.alt && isArabicTextNoise(r.alt)).map((r) => r.id));
                        }}
                        variant="ghost"
                    >
                        <FilterIcon />
                    </Button>
                    {altCount !== rows.length && (
                        <Button
                            aria-label="Filter Misaligned Observations"
                            className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-bold"
                            onClick={() => {
                                record('FilterByMissingAlt');
                                filterByPages(rows.filter((r) => !r.alt).map((r) => r.page));
                            }}
                            variant="destructive"
                        >
                            ✗
                        </Button>
                    )}
                    {hasMissingHonorifics && (
                        <Button
                            aria-label="Fix Typos"
                            className="flex items-center justify-center w-6 h-6 hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-bold"
                            onClick={() => {
                                record('FilterByHonorifics');
                                filterByIds(rows.filter((r) => r.includesHonorifics).map((r) => r.id));
                            }}
                            variant="ghost"
                        >
                            {SWS_SYMBOL}
                        </Button>
                    )}
                    {hasDivergence && (
                        <Button
                            aria-label="Divergence"
                            className="flex items-center justify-center w-6 h-6 hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 focus:outline-none font-bold"
                            onClick={() => {
                                const pages = filterRowsByDivergence(rows);
                                record('FilterByDivergence', pages.length.toString());

                                filterByPages(pages);
                            }}
                            variant="ghost"
                        >
                            <StrikethroughIcon />
                        </Button>
                    )}
                    <div className="text-right w-full">
                        <SubmittableInput
                            className={`w-full !text-xl leading-relaxed text-gray-800 bg-transparent border-none outline-none focus:bg-gray-50 focus:rounded px-1 py-1 transition-colors duration-150`}
                            name="query"
                            onSubmit={(query) => {
                                record('QueryAlt');
                                queryRows(query, 'alt');
                            }}
                            placeholder={`Support (${altCount})`}
                        />
                    </div>
                </div>
            </th>
        </tr>
    );
}
