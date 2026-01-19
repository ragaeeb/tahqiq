import { afterEach, beforeEach, describe, expect, it, jest, mock } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import type { SheetLine } from '@/stores/manuscriptStore/types';

const record = jest.fn();

mock.module('nanolytics', () => ({ record }));

mock.module('blumbaben', () => ({ withFormattingToolbar: (Component: any) => Component }));

mock.module('@/components/ui/button', () => ({
    Button: ({ children, ...props }: any) => (
        <button type="button" {...props}>
            {children}
        </button>
    ),
}));

mock.module('./shared', () => ({
    ActionButton: ({ children, ...props }: any) => (
        <button type="button" {...props}>
            {children}
        </button>
    ),
}));

mock.module('@/components/ui/dropdown-menu', () => {
    const Wrapper = ({ children, onOpenChange: _onOpenChange, ...props }: any) => <div {...props}>{children}</div>;
    const ButtonWrapper = ({ children, onSelect, onClick, onOpenChange: _onOpenChange, ...props }: any) => (
        <button
            onClick={(event) => {
                onClick?.(event);
                onSelect?.(event);
            }}
            type="button"
            {...props}
        >
            {children}
        </button>
    );

    return {
        DropdownMenu: Wrapper,
        DropdownMenuContent: Wrapper,
        DropdownMenuItem: ButtonWrapper,
        DropdownMenuPortal: Wrapper,
        DropdownMenuSub: Wrapper,
        DropdownMenuSubContent: Wrapper,
        DropdownMenuSubTrigger: ButtonWrapper,
        DropdownMenuTrigger: ButtonWrapper,
    };
});

mock.module('@/components/input-menu', () => ({
    InputMenu: ({ label, onSubmit }: any) => (
        <button onClick={() => onSubmit(label === 'Page #' ? '12' : 'value')} type="button">
            {label}
        </button>
    ),
}));

mock.module('@/components/confirm-dropdown-menu-item', () => ({
    ConfirmDropdownMenuItem: ({ children, onClick }: any) => (
        <button onClick={onClick} type="button">
            {children}
        </button>
    ),
}));

const storeState: any = {
    alignPoetry: jest.fn(),
    clearOutPages: jest.fn(),
    deleteLines: jest.fn(),
    deleteSupport: jest.fn(),
    expandFilteredRow: jest.fn(),
    filterByPages: jest.fn(),
    mergeWithAbove: jest.fn(),
    mergeWithBelow: jest.fn(),
    saveId: jest.fn(),
    setUrl: jest.fn(),
    splitAltAtLineBreak: jest.fn(),
    toggleFootnotes: jest.fn(),
    updatePageNumber: jest.fn(),
    updateTextLines: jest.fn(),
};

mock.module('@/stores/manuscriptStore/useManuscriptStore', () => ({
    useManuscriptStore: (selector: any) => selector(storeState),
}));

import AslContainer from './asl-container';
import TextRow from './index';
import PageInfo from './page-info';
import SupportContainer from './support-container';

const createLine = (overrides: Partial<SheetLine>): SheetLine =>
    ({
        alt: overrides.alt ?? 'alt text',
        id: overrides.id ?? 1,
        lastUpdate: overrides.lastUpdate ?? Date.now(),
        page: overrides.page ?? 1,
        text: overrides.text ?? 'text',
        ...overrides,
    }) as SheetLine;

describe('Text Row suite', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        Object.values(storeState).forEach((value) => {
            if (typeof value === 'function' && 'mockReset' in value) {
                value.mockReset();
            }
        });
        record.mockReset();
    });

    it('renders text rows and forwards selection changes', () => {
        const line = createLine({ id: 25 });
        const handleSelection = jest.fn();
        render(
            <table>
                <tbody>
                    <TextRow
                        data={line}
                        isNewPage
                        isSelected={false}
                        onSelectionChange={handleSelection}
                        previewPdf={() => {}}
                    />
                </tbody>
            </table>,
        );

        const checkbox = screen.getByLabelText('Select row 25');
        fireEvent.click(checkbox);
        expect(handleSelection).toHaveBeenCalledWith(line, true, false);
    });

    it('handles asl actions and formatting toggles', () => {
        const line = createLine({ id: 1, isFootnote: false, isHeading: false, isPoetic: false });
        render(<AslContainer data={line} />);

        fireEvent.click(screen.getAllByLabelText('Delete Asl')[0]!);
        expect(record).toHaveBeenCalledWith('DeleteAsl');
        expect(storeState.deleteLines).toHaveBeenCalledWith([1]);

        fireEvent.click(screen.getAllByLabelText('Mark as Heading')[0]!);
        expect(storeState.updateTextLines).toHaveBeenCalledWith([1], { isHeading: true });

        fireEvent.click(screen.getAllByLabelText('Mark as Footnote')[0]!);
        expect(storeState.toggleFootnotes).toHaveBeenCalledWith(line.page, line.id, true);

        fireEvent.click(screen.getAllByLabelText('Mark as Poetry')[0]!);
        expect(storeState.updateTextLines).toHaveBeenCalledWith([1], { isPoetic: true });
    });

    it('supports accepting alt text and editing support fields', () => {
        const line = createLine({ id: 4, page: 2 });
        render(<SupportContainer data={line} />);

        fireEvent.click(screen.getAllByLabelText('Accept Support')[0]!);
        expect(record).toHaveBeenCalledWith('ApplyAltToAsl');
        expect(storeState.updateTextLines).toHaveBeenCalledWith([4], { text: line.alt });

        fireEvent.click(screen.getAllByLabelText('Delete Support')[0]!);
        expect(storeState.deleteSupport).toHaveBeenCalledWith(line.page, line.id);

        fireEvent.change(screen.getByPlaceholderText('✗'), { target: { value: `${line.alt} updated` } });
        expect(storeState.splitAltAtLineBreak).toHaveBeenCalledWith(line.page, line.id, `${line.alt} updated`);
    });

    it('provides page level actions and preview controls', () => {
        const preview = jest.fn();
        render(<PageInfo id={3} page={7} previewPdf={preview} />);

        fireEvent.click(screen.getAllByLabelText('Filter to Page')[0]!);
        expect(record).toHaveBeenCalledWith('FilterByPageOfLine');
        expect(storeState.filterByPages).toHaveBeenCalledWith([7]);

        fireEvent.click(screen.getAllByLabelText('Save Row')[0]!);
        expect(storeState.saveId).toHaveBeenCalledWith(3);

        fireEvent.click(screen.getAllByText('Page #')[0]!);
        expect(storeState.updatePageNumber).toHaveBeenCalledWith(7, 12, true);

        fireEvent.click(screen.getAllByLabelText('Preview PDF')[0]!);
        expect(preview).toHaveBeenCalledWith(7);
    });
});
