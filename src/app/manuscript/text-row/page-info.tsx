import { ExpandIcon, EyeIcon, FilterIcon, StarIcon } from 'lucide-react';
import { record } from 'nanolytics';
import React from 'react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

type PageInfoProps = Readonly<{
    id: number;
    page: number;
    previewPdf: (page: number) => void;
}>;

function PageInfo({ id, page, previewPdf }: PageInfoProps) {
    const filterByPages = useManuscriptStore((state) => state.filterByPages);
    const saveId = useManuscriptStore((state) => state.saveId);
    const expandFilteredRow = useManuscriptStore((state) => state.expandFilteredRow);

    return (
        <div className="flex items-center justify-center">
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-center min-w-0 hover:bg-gray-50 rounded px-1 py-0.5 transition-colors">
                    {page}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                    <DropdownMenuItem
                        aria-label="Filter to Page"
                        className="flex items-center gap-2 px-3 py-2"
                        onSelect={() => {
                            record('FilterByPageOfLine');
                            filterByPages([page]);
                        }}
                    >
                        <FilterIcon className="w-4 h-4" />
                        <span>Filter</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        aria-label="Preview PDF"
                        className="flex items-center gap-2 px-3 py-2"
                        onSelect={() => {
                            record('PreviewPdfPage');
                            previewPdf(page);
                        }}
                    >
                        <EyeIcon className="w-4 h-4" />
                        <span>Preview</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        aria-label="Expand"
                        className="flex items-center gap-2 px-3 py-2"
                        onSelect={() => {
                            record('ExpandFilteredRow');
                            expandFilteredRow(id);
                        }}
                    >
                        <ExpandIcon /> Expand
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        aria-label="Expand"
                        className="flex items-center gap-2 px-3 py-2"
                        onSelect={() => {
                            record('SaveRow');
                            saveId(id);
                        }}
                    >
                        <StarIcon /> Save
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export default React.memo(PageInfo);
