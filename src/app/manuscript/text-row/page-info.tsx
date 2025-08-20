import { EraserIcon, ExpandIcon, EyeIcon, FilterIcon, SignatureIcon, StarIcon, SubscriptIcon } from 'lucide-react';
import { record } from 'nanolytics';
import React, { useState } from 'react';

import { ConfirmDropdownMenuItem } from '@/components/confirm-dropdown-menu-item';
import { InputMenu } from '@/components/input-menu';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

import { ActionButton } from './shared';

type PageInfoProps = Readonly<{
    id: number;
    page: number;
    previewPdf: (page: number) => void;
}>;

function PageInfo({ id, page, previewPdf }: PageInfoProps) {
    const filterByPages = useManuscriptStore((state) => state.filterByPages);
    const saveId = useManuscriptStore((state) => state.saveId);
    const expandFilteredRow = useManuscriptStore((state) => state.expandFilteredRow);
    const clearOutPages = useManuscriptStore((state) => state.clearOutPages);
    const alignPoetry = useManuscriptStore((state) => state.alignPoetry);
    const updatePages = useManuscriptStore((state) => state.updatePages);
    const updatePageNumber = useManuscriptStore((state) => state.updatePageNumber);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="flex items-center justify-center">
            <DropdownMenu onOpenChange={setIsMenuOpen} open={isMenuOpen}>
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
                        aria-label="Clear Footnotes"
                        className="flex items-center gap-2 px-3 py-2"
                        onSelect={() => {
                            record('ClearPageFootnotes');
                            updatePages([page], { isFootnote: false });
                        }}
                    >
                        <SubscriptIcon className="w-4 h-4" />
                        <span>F̶o̶o̶t̶n̶o̶t̶e̶s̶</span>
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
                        aria-label="Align"
                        className="flex items-center gap-2 px-3 py-2"
                        onSelect={() => {
                            record('AlignPoetry');
                            alignPoetry([page]);
                        }}
                    >
                        <SignatureIcon /> Align
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        aria-label="Save Row"
                        className="flex items-center gap-2 px-3 py-2"
                        onSelect={() => {
                            record('SaveRow');
                            saveId(id);
                        }}
                    >
                        <StarIcon /> Save
                    </DropdownMenuItem>
                    <InputMenu
                        label="Page #"
                        onSubmit={(value) => {
                            setIsMenuOpen(false);
                            updatePageNumber(page, Number(value), true);
                        }}
                        placeholder="Enter new page number..."
                    />
                    <ConfirmDropdownMenuItem
                        onClick={() => {
                            record('ErasePage');
                            clearOutPages([page]);
                        }}
                    >
                        <EraserIcon /> Erase
                    </ConfirmDropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <ActionButton
                aria-label="Preview PDF"
                onClick={() => {
                    record('PreviewPdfPage');
                    previewPdf(page);
                }}
            >
                <EyeIcon className="w-4 h-4" />
            </ActionButton>
        </div>
    );
}

export default React.memo(PageInfo);
