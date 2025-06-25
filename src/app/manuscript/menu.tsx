import { HighlighterIcon, SignatureIcon, SuperscriptIcon } from 'lucide-react';

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
    deleteLines: () => void;
    markAsFootnotes: (value: boolean) => void;
    markAsHeading: (value: boolean) => void;
    markAsPoetry: (value: boolean) => void;
    onFixSwsSymbol: () => void;
    onReplaceSwsWithAzw: () => void;
};

export function ManuscriptMenu({
    autoCorrectFootnotes,
    deleteLines,
    markAsFootnotes,
    markAsHeading,
    markAsPoetry,
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
                                <DropdownMenuItem onClick={onFixSwsSymbol}>Fix {SWS_SYMBOL}</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onReplaceSwsWithAzw}>
                                    Replace {SWS_SYMBOL} with {AZW_SYMBOL}
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Footnotes</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => markAsFootnotes(true)}>
                                    Apply <SuperscriptIcon />
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => markAsFootnotes(false)}>Clear</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={autoCorrectFootnotes}>Autocorrect</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Poetry</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => markAsPoetry(true)}>
                                    Apply <SignatureIcon />
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => markAsPoetry(false)}>Clear</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Heading</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => markAsHeading(true)}>
                                    Apply <HighlighterIcon />
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => markAsHeading(false)}>Clear</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={deleteLines}>✘ Delete</DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
