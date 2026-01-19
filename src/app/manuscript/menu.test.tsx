import { describe, expect, it, jest, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';

mock.module('@/components/ui/dropdown-menu', () => {
    const DivWrapper = ({ children, className }: any) => <div className={className}>{children}</div>;
    const DropdownMenu = ({ children }: any) => <div>{children}</div>;
    const ButtonWrapper = ({ children, className, onSelect, onClick }: any) => (
        <button
            className={className}
            onClick={(event) => {
                onClick?.(event);
                onSelect?.(event);
            }}
            type="button"
        >
            {children}
        </button>
    );

    return {
        DropdownMenu,
        DropdownMenuContent: DivWrapper,
        DropdownMenuGroup: DivWrapper,
        DropdownMenuItem: ButtonWrapper,
        DropdownMenuPortal: DivWrapper,
        DropdownMenuSeparator: () => <hr />,
        DropdownMenuSub: DivWrapper,
        DropdownMenuSubContent: DivWrapper,
        DropdownMenuSubTrigger: ButtonWrapper,
        DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
    };
});

mock.module('@/components/confirm-dropdown-menu-item', () => ({
    ConfirmDropdownMenuItem: ({ children, onClick }: any) => (
        <button onClick={onClick} type="button">
            {children}
        </button>
    ),
}));

mock.module('@/components/input-menu', () => ({
    InputMenu: ({ label, onSubmit }: any) => (
        <button
            onClick={() => {
                if (label === 'Find Similar') {
                    onSubmit('0.5');
                } else if (label === 'Replace Asl') {
                    onSubmit('updated text');
                }
            }}
            type="button"
        >
            {label}
        </button>
    ),
}));

import { ManuscriptMenu } from './menu';

describe('ManuscriptMenu', () => {
    it('wires menu actions to callbacks', () => {
        const props = {
            autoCorrectFootnotes: jest.fn(),
            deleteLines: jest.fn(),
            deleteSupports: jest.fn(),
            findSimilar: jest.fn(),
            fixIntaha: jest.fn(),
            markAsHeading: jest.fn(),
            markAsPoetry: jest.fn(),
            mergeRows: jest.fn(),
            onFixSwsSymbol: jest.fn(),
            onReplaceText: jest.fn(),
        };

        render(<ManuscriptMenu {...props} />);

        fireEvent.click(screen.getByText(/Fix\s+ﷺ/));
        expect(props.onFixSwsSymbol).toHaveBeenCalled();

        fireEvent.click(screen.getAllByText('Find Similar')[0]!);
        expect(props.findSimilar).toHaveBeenCalledWith(0.5);

        fireEvent.click(screen.getAllByText('Replace Asl')[0]!);
        expect(props.onReplaceText).toHaveBeenCalledWith('updated text');

        fireEvent.click(screen.getAllByText(/Autocorrect/)[0]!);
        expect(props.autoCorrectFootnotes).toHaveBeenCalled();

        fireEvent.click(screen.getAllByText(/Fix اهـ/)[0]!);
        expect(props.fixIntaha).toHaveBeenCalled();

        fireEvent.click(screen.getAllByText('Merge')[0]!);
        expect(props.mergeRows).toHaveBeenCalled();

        fireEvent.click(screen.getAllByText('✘ Delete')[0]!);
        expect(props.deleteLines).toHaveBeenCalled();

        fireEvent.click(screen.getAllByText('✘ Delete Support')[0]!);
        expect(props.deleteSupports).toHaveBeenCalled();
    });
});
