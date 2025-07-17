import { EraserIcon, HighlighterIcon, SignatureIcon, SuperscriptIcon } from 'lucide-react';

import { ConfirmDropdownMenuItem } from '@/components/confirm-dropdown-menu-item';
import { Button, type ButtonPropsType } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AZW_SYMBOL, SWS_SYMBOL } from '@/lib/constants';

type ManuscriptMenuProps = ButtonPropsType & {
    autoCorrectFootnotes: () => void;
    clearOutPages: () => void;
    deleteLines: () => void;
    markAsFootnotes: (value: boolean) => void;
    markAsHeading: (value: boolean) => void;
    markAsPoetry: (value: boolean) => void;
    mergeWithAbove: () => void;
    onFixSwsSymbol: () => void;
    onReplaceSwsWithAzw: () => void;
};

export function ManuscriptMenu({
    autoCorrectFootnotes,
    clearOutPages,
    deleteLines,
    markAsFootnotes,
    markAsHeading,
    markAsPoetry,
    mergeWithAbove,
    onFixSwsSymbol,
    onReplaceSwsWithAzw,
    ...props
}: ManuscriptMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" {...props}>
                    Apply
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuGroup>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>{SWS_SYMBOL}</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onSelect={onFixSwsSymbol}>Fix {SWS_SYMBOL}</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={onReplaceSwsWithAzw}>
                                    Replace {SWS_SYMBOL} with {AZW_SYMBOL}
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Footnotes</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onSelect={() => markAsFootnotes(true)}>
                                    Apply <SuperscriptIcon />
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => markAsFootnotes(false)}>Clear</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={autoCorrectFootnotes}>Autocorrect</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Poetry</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onSelect={() => markAsPoetry(true)}>
                                    Apply <SignatureIcon />
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => markAsPoetry(false)}>Clear</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Heading</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onSelect={() => markAsHeading(true)}>
                                    Apply <HighlighterIcon />
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => markAsHeading(false)}>Clear</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuItem onSelect={() => mergeWithAbove()}>Merge With Above ↑</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <ConfirmDropdownMenuItem onClick={deleteLines}>✘ Delete</ConfirmDropdownMenuItem>
                    <ConfirmDropdownMenuItem onClick={clearOutPages}>
                        <EraserIcon /> Clear Out Pages
                    </ConfirmDropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
