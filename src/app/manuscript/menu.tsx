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
    markAsFootnotes: (value: boolean, applyToEntirePage?: boolean) => void;
    markAsHeading: (value: boolean) => void;
    markAsPoetry: (value: boolean, applyToEntirePage?: boolean) => void;
    mergeWithAbove: () => void;
    onFixSwsSymbol: () => void;
    onReplaceSwsWithAzw: () => void;
};

type NestedMenuProps = {
    children?: React.ReactNode;
    label: string;
    onSelect: (value: boolean, applyToEntirePage?: boolean) => void;
};

const NestedMenu = ({ children, label, onSelect }: NestedMenuProps) => {
    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Apply</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onSelect={() => onSelect(true, true)}>
                                    To Page <SignatureIcon />
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onSelect(true)}>
                                    To Row <SignatureIcon />
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Clear</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onSelect={() => onSelect(false, true)}>Page</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onSelect(false)}>Row</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    {children}
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    );
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
                    <NestedMenu label="Footnotes" onSelect={markAsFootnotes}>
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={autoCorrectFootnotes}>
                                Autocorrect <SuperscriptIcon />
                            </DropdownMenuItem>
                        </>
                    </NestedMenu>
                    <NestedMenu label="Poetry" onSelect={markAsPoetry} />
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
