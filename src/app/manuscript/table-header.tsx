import { parsePageRanges } from 'bitaboom';
import { BookmarkIcon, BracketsIcon, SignatureIcon, StrikethroughIcon, SubscriptIcon } from 'lucide-react';
import { record } from 'nanolytics';
import type { Dispatch, SetStateAction } from 'react';
import SubmittableInput from '@/components/submittable-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { INTAHA_TYPO, SWS_SYMBOL } from '@/lib/constants';
import { filterRowsByDivergence } from '@/lib/filtering';
import type { SheetLine } from '@/stores/manuscriptStore/types';
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
    const savedIds = useManuscriptStore((state) => state.savedIds);
    const filterByPages = useManuscriptStore((state) => state.filterByPages);
    const altCount = rows.filter((r) => r.alt).length;
    const isAllSelected = rows.length > 0 && selectedRows.length === rows.length;
    const hasMissingHonorifics = rows.some((o) => o.includesHonorifics);
    const includesPoetry = rows.some((o) => o.isPoetic);
    const hasDivergence = rows.some((o) => !o.isSimilar);
    const hasInvalidFootnotes = rows.some((o) => o.hasInvalidFootnotes);
    const hasHeadings = rows.some((o) => o.isHeading);
    const hasFootnotes = rows.some((o) => o.isFootnote);
    const hasCenteredContent = rows.some((o) => o.isCentered);

    return (
        <tr>
            <th
                aria-label="Select All"
                className="w-12 px-4 py-3 text-center font-semibold text-gray-700 text-sm uppercase tracking-wide"
            >
                <Checkbox checked={isAllSelected} onCheckedChange={(checked) => onSelectAll(Boolean(checked))} />
            </th>
            <th
                aria-label="Page"
                className="w-20 px-4 py-3 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide"
            >
                <div className="flex items-center justify-between">
                    <SubmittableInput
                        className={`!text-xl w-full border-none bg-transparent px-1 py-1 text-gray-800 text-xs! leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50`}
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
                className="w-1/2 px-4 py-3 text-right font-semibold text-gray-700 text-sm uppercase tracking-wide"
                dir="rtl"
            >
                <div className="flex items-center justify-between">
                    <Button
                        aria-label="Filter Intaha"
                        className="flex h-6 w-6 items-center justify-center font-bold transition-colors duration-150 hover:bg-blue-200 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        onClick={() => {
                            record('FilterIntaha');

                            const regex = new RegExp(`( )(${INTAHA_TYPO})[.]?($| )`);

                            filterByIds(rows.filter((r) => regex.test(r.text)).map((r) => r.id));
                        }}
                        variant="outline"
                    >
                        اهـ
                    </Button>
                    {hasCenteredContent && (
                        <Button
                            aria-label="Centered Content"
                            className="flex h-6 w-6 items-center justify-center font-bold transition-colors duration-150 hover:bg-blue-200 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                            className="flex h-6 w-6 items-center justify-center font-bold transition-colors duration-150 hover:bg-blue-200 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            onClick={() => {
                                record('FilterByHeadings');
                                filterByIds(rows.filter((r) => r.isHeading).map((r) => r.id));
                            }}
                            variant="ghost"
                        >
                            <BookmarkIcon />
                        </Button>
                    )}
                    {hasFootnotes && (
                        <Button
                            aria-label="Footnotes"
                            className="flex h-6 w-6 items-center justify-center font-bold transition-colors duration-150 hover:bg-blue-200 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            onClick={() => {
                                const pageGroups = new Map<number, SheetLine[]>();

                                for (const row of rows) {
                                    if (!pageGroups.has(row.page)) {
                                        pageGroups.set(row.page, []);
                                    }
                                    pageGroups.get(row.page)!.push(row);
                                }

                                const footnoteHeavyPages: number[] = [];

                                // Analyze each page
                                for (const [pageNumber, pageRows] of pageGroups) {
                                    const totalRows = pageRows.length;
                                    const footnoteRows = pageRows.filter((row) => row.isFootnote).length;
                                    const footnotePercentage = footnoteRows / totalRows;

                                    if (footnotePercentage >= 0.8) {
                                        footnoteHeavyPages.push(pageNumber);
                                    }
                                }

                                record('FilterByFootnotes', footnoteHeavyPages.length.toString());

                                filterByPages(footnoteHeavyPages);
                            }}
                            variant="ghost"
                        >
                            <SubscriptIcon />
                        </Button>
                    )}
                    {hasInvalidFootnotes && (
                        <Button
                            aria-label="Invalid Footnotes"
                            className="flex h-6 w-6 items-center justify-center transition-colors duration-150 hover:bg-blue-200 hover:text-blue-800 focus:outline-none"
                            onClick={() => {
                                record('FilterByInvalidFootnotes');
                                filterByPages(rows.filter((r) => r.hasInvalidFootnotes).map((r) => r.page));
                            }}
                            variant="ghost"
                        >
                            <BracketsIcon />
                        </Button>
                    )}
                    {savedIds.length > 0 && (
                        <Button
                            aria-label="Saved Rows"
                            className="flex h-6 w-6 items-center justify-center transition-colors duration-150 hover:bg-blue-200 hover:text-blue-800 focus:outline-none"
                            onClick={() => {
                                record('FilterBySavedRows', savedIds.length.toString());
                                filterByIds(savedIds);
                            }}
                            variant="ghost"
                        >
                            ★
                        </Button>
                    )}
                    {includesPoetry && (
                        <Button
                            aria-label="Poetic"
                            className="flex h-6 w-6 items-center justify-center font-bold transition-colors duration-150 hover:bg-blue-200 hover:text-blue-800 focus:outline-none"
                            onClick={() => {
                                record('FilterByPoetic');
                                filterByIds(rows.filter((r) => r.isPoetic).map((r) => r.id));
                            }}
                            variant="ghost"
                        >
                            <SignatureIcon />
                        </Button>
                    )}
                    <div className="w-full text-right">
                        <SubmittableInput
                            className={`!text-xl w-full border-none bg-transparent px-1 py-1 text-gray-800 leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50`}
                            name="query"
                            onSubmit={(query) => {
                                record('QueryObservations');
                                filterByIds(rows.filter((r) => r.text.includes(query)).map((r) => r.id));
                            }}
                            placeholder={`Text (${rows.length})`}
                        />
                    </div>
                </div>
            </th>
            <th
                aria-label="Support"
                className="w-1/2 px-4 py-3 font-semibold text-gray-700 text-sm uppercase tracking-wide"
                dir="rtl"
            >
                <div className="flex items-center justify-between">
                    {altCount !== rows.length && (
                        <Button
                            aria-label="Filter Misaligned Observations"
                            className="flex h-6 w-6 items-center justify-center rounded-full font-bold transition-colors duration-150 hover:bg-blue-200 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                            className="flex h-6 w-6 items-center justify-center font-bold transition-colors duration-150 hover:bg-blue-200 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                            className="flex h-6 w-6 items-center justify-center font-bold transition-colors duration-150 hover:bg-blue-200 hover:text-blue-800 focus:outline-none"
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
                    <div className="w-full text-right">
                        <SubmittableInput
                            className={`!text-xl w-full border-none bg-transparent px-1 py-1 text-gray-800 leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50`}
                            name="query"
                            onSubmit={(query) => {
                                record('QueryAlt');
                                filterByIds(rows.filter((r) => r.alt.includes(query)).map((r) => r.id));
                            }}
                            placeholder={`Support (${altCount})`}
                        />
                    </div>
                </div>
            </th>
        </tr>
    );
}
