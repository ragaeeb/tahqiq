import { describe, expect, it, jest, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';

const record = jest.fn();

mock.module('nanolytics', () => ({ record }));

mock.module('@/components/submittable-input', () => ({
    default: ({ defaultValue, name, onSubmit, placeholder }: any) => (
        <input
            data-testid={`input-${name}`}
            defaultValue={defaultValue}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    onSubmit((e.target as HTMLInputElement).value);
                }
            }}
            placeholder={placeholder}
        />
    ),
}));

mock.module('@/components/ui/dialog-trigger', () => ({
    DialogTriggerButton: ({ children, onClick, title }: any) => (
        <button onClick={onClick} title={title} type="button">
            {children}
        </button>
    ),
}));

mock.module('./search-replace-dialog', () => ({
    SearchReplaceDialogContent: () => <div>Search Replace Dialog Content</div>,
}));

mock.module('./translation-dialog', () => ({ TranslationDialogContent: () => <div>Translation Dialog Content</div> }));

import ExcerptsTableHeader from './table-header';

describe('ExcerptsTableHeader', () => {
    const defaultProps = {
        activeTab: 'excerpts',
        excerpts: [{ id: 'E1' }] as any[],
        filters: { nass: '', page: '', text: '' },
        footnotes: [],
        headings: [],
        onFilterChange: jest.fn(),
    };

    describe('excerpts tab', () => {
        it('renders excerpt header with filter inputs', () => {
            render(
                <table>
                    <thead>
                        <ExcerptsTableHeader {...defaultProps} />
                    </thead>
                </table>,
            );

            expect(screen.getByTestId('input-from')).toBeDefined();
            expect(screen.getByTestId('input-nass')).toBeDefined();
            expect(screen.getByTestId('input-text')).toBeDefined();
        });

        it('displays excerpt count in nass placeholder', () => {
            const props = { ...defaultProps, excerpts: [{ id: 'E1' }, { id: 'E2' }, { id: 'E3' }] as any[] };

            render(
                <table>
                    <thead>
                        <ExcerptsTableHeader {...props} />
                    </thead>
                </table>,
            );

            expect(screen.getByPlaceholderText(/Arabic \(3\)/)).toBeDefined();
        });

        it('calls onFilterChange when page filter submitted', () => {
            const onFilterChange = jest.fn();
            const props = { ...defaultProps, onFilterChange };

            render(
                <table>
                    <thead>
                        <ExcerptsTableHeader {...props} />
                    </thead>
                </table>,
            );

            const pageInput = screen.getByTestId('input-from');
            fireEvent.change(pageInput, { target: { value: '50' } });
            fireEvent.keyDown(pageInput, { key: 'Enter' });

            expect(onFilterChange).toHaveBeenCalledWith('page', '50');
        });

        it('calls onFilterChange when nass filter submitted', () => {
            const onFilterChange = jest.fn();
            const props = { ...defaultProps, onFilterChange };

            render(
                <table>
                    <thead>
                        <ExcerptsTableHeader {...props} />
                    </thead>
                </table>,
            );

            const nassInput = screen.getByTestId('input-nass');
            fireEvent.change(nassInput, { target: { value: 'البسملة' } });
            fireEvent.keyDown(nassInput, { key: 'Enter' });

            expect(onFilterChange).toHaveBeenCalledWith('nass', 'البسملة');
        });
    });

    describe('headings tab', () => {
        it('renders heading header with filter inputs', () => {
            const props = { ...defaultProps, activeTab: 'headings', headings: [{ id: 'H1' }, { id: 'H2' }] as any[] };

            render(
                <table>
                    <thead>
                        <ExcerptsTableHeader {...props} />
                    </thead>
                </table>,
            );

            expect(screen.getByPlaceholderText(/Arabic \(2\)/)).toBeDefined();
            expect(screen.getByText('Parent')).toBeDefined();
        });
    });

    describe('footnotes tab', () => {
        it('renders footnote header with filter inputs', () => {
            const props = { ...defaultProps, activeTab: 'footnotes', footnotes: [{ id: 'F1' }] as any[] };

            render(
                <table>
                    <thead>
                        <ExcerptsTableHeader {...props} />
                    </thead>
                </table>,
            );

            expect(screen.getByPlaceholderText(/Arabic \(1\)/)).toBeDefined();
        });
    });

    describe('SearchReplaceButton', () => {
        it('records analytics when clicked', () => {
            render(
                <table>
                    <thead>
                        <ExcerptsTableHeader {...defaultProps} />
                    </thead>
                </table>,
            );

            const searchReplaceButton = screen.getByTitle('Search and Replace');
            fireEvent.click(searchReplaceButton);

            expect(record).toHaveBeenCalledWith('OpenSearchReplace');
        });
    });
});
