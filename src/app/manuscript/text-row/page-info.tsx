import { EraserIcon, ExpandIcon, EyeIcon, FilterIcon, SignatureIcon, StarIcon } from 'lucide-react';
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

type PageInfoProps = Readonly<{ id: number; page: number; previewPdf: (page: number) => void }>;

function PageInfo({ id, page, previewPdf }: PageInfoProps) {
    const filterByPages = useManuscriptStore((state) => state.filterByPages);
    const saveId = useManuscriptStore((state) => state.saveId);
    const expandFilteredRow = useManuscriptStore((state) => state.expandFilteredRow);
    const clearOutPages = useManuscriptStore((state) => state.clearOutPages);
    const alignPoetry = useManuscriptStore((state) => state.alignPoetry);
    const updatePageNumber = useManuscriptStore((state) => state.updatePageNumber);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="flex items-center justify-center">
            <DropdownMenu onOpenChange={setIsMenuOpen} open={isMenuOpen}>
                <DropdownMenuTrigger className="flex min-w-0 items-center justify-center rounded px-1 py-0.5 transition-colors hover:bg-gray-50">
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
                        <FilterIcon className="h-4 w-4" />
                        <span>Filter</span>
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
                        inputMode="numeric"
                        label="Page #"
                        onSubmit={(value) => {
                            setIsMenuOpen(false);
                            updatePageNumber(page, Number(value), true);
                        }}
                        pattern="\d+"
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
                <EyeIcon className="h-4 w-4" />
            </ActionButton>
        </div>
    );
}

export default React.memo(PageInfo);
