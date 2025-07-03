import React from 'react';

import { Button, type ButtonPropsType } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { selectTableOfContents } from '@/stores/bookStore/selectors';
import { useBookStore } from '@/stores/bookStore/useBookStore';

type TableOfContentsMenuProps = ButtonPropsType & {
    onBookmarkClicked: () => void;
};

function TableOfContentsMenu({ onBookmarkClicked, ...props }: TableOfContentsMenuProps) {
    const tableOfContents = useBookStore(selectTableOfContents);

    if (!tableOfContents.length) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" {...props}>
                    Index
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuGroup>
                    {tableOfContents.map((b) => (
                        <DropdownMenuItem key={b.id} onClick={onBookmarkClicked}>
                            {b.title}
                            <DropdownMenuShortcut>Page {b.page}</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default React.memo(TableOfContentsMenu);
