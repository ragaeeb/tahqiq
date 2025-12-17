import { afterAll, describe, expect, it, jest } from 'bun:test';
import { render, screen } from '@testing-library/react';
import type { SheetLine } from '@/stores/manuscriptStore/types';
import ManuscriptTableBody from './table-body';
import * as TextRowModule from './text-row';

const textRowCalls: any[] = [];

const textRowSpy = jest.spyOn(TextRowModule, 'default');
textRowSpy.mockImplementation(({ data, isNewPage, isSelected }: any) => {
    textRowCalls.push({ data, isNewPage, isSelected });

    return (
        <tr data-testid="text-row" data-new-page={isNewPage} data-selected={isSelected}>
            <td>{data.text}</td>
        </tr>
    );
});

const createLine = (overrides: Partial<SheetLine>): SheetLine =>
    ({
        alt: overrides.alt ?? 'alt text',
        id: overrides.id ?? Math.random(),
        isFootnote: overrides.isFootnote ?? false,
        lastUpdate: overrides.lastUpdate ?? Date.now(),
        page: overrides.page ?? 1,
        text: overrides.text ?? 'row',
    }) as SheetLine;

describe('ManuscriptTableBody', () => {
    it('renders virtualized rows with selection and page change markers', () => {
        const rows = [createLine({ id: 1, page: 1, text: 'First' }), createLine({ id: 2, page: 2, text: 'Second' })];
        const onSelectionChange = jest.fn();
        const previewPdf = jest.fn();

        render(
            <ManuscriptTableBody
                onSelectionChange={onSelectionChange}
                previewPdf={previewPdf}
                rows={rows}
                selectedRows={[rows[1]!]}
            />,
        );

        const renderedRows = screen.getAllByTestId('text-row');
        expect(renderedRows).toHaveLength(2);
        expect(renderedRows[0]?.getAttribute('data-new-page')).toBe('false');
        expect(renderedRows[0]?.getAttribute('data-selected')).toBe('false');
        expect(renderedRows[1]?.getAttribute('data-new-page')).toBe('true');
        expect(renderedRows[1]?.getAttribute('data-selected')).toBe('true');
    });
});

afterAll(() => {
    textRowSpy.mockRestore();
});
