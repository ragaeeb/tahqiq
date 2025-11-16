import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';

import type { SheetLine } from '@/stores/manuscriptStore/types';

const record = jest.fn();

mock.module('nanolytics', () => ({
    record,
}));

const storeState: any = {
    filterByIds: jest.fn(),
    filterByPages: jest.fn(),
    savedIds: [],
};

mock.module('@/stores/manuscriptStore/useManuscriptStore', () => ({
    useManuscriptStore: (selector: any) => selector(storeState),
}));

mock.module('@/lib/filtering', () => ({
    filterRowsByDivergence: () => [99],
}));

mock.module('bitaboom', () => ({
    parsePageRanges: () => [42],
}));


import ManuscriptTableHeader from './table-header';

const createLine = (overrides: Partial<SheetLine>): SheetLine => ({
    alt: overrides.alt ?? 'alt text',
    hasInvalidFootnotes: overrides.hasInvalidFootnotes,
    id: overrides.id ?? Math.random(),
    includesHonorifics: overrides.includesHonorifics,
    isCentered: overrides.isCentered,
    isFootnote: overrides.isFootnote,
    isHeading: overrides.isHeading,
    isPoetic: overrides.isPoetic,
    isSimilar: overrides.isSimilar,
    lastUpdate: overrides.lastUpdate ?? Date.now(),
    page: overrides.page ?? 1,
    text: overrides.text ?? 'row',
} as SheetLine);

describe('ManuscriptTableHeader', () => {
    beforeEach(() => {
        storeState.filterByIds = jest.fn();
        storeState.filterByPages = jest.fn();
        storeState.savedIds = [];
        record.mockReset();
    });

    it('toggles select all checkbox state', () => {
        const rows = [createLine({ id: 1 }), createLine({ id: 2 })];
        const onSelectAll = jest.fn();
        render(
            <table>
                <tbody>
                    <ManuscriptTableHeader onSelectAll={onSelectAll} rows={rows} selection={[rows, () => {}] as any} />
                </tbody>
            </table>,
        );

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        expect(onSelectAll).toHaveBeenCalledWith(false);
    });

    it('exposes filtering shortcuts for derived states', () => {
        const rows = [
            createLine({ id: 1, page: 10, isFootnote: true, alt: '' }),
            createLine({ id: 2, page: 10, isFootnote: true, alt: '' }),
            createLine({ id: 3, page: 10, isFootnote: true, alt: '' }),
            createLine({ id: 4, page: 10, isFootnote: true, alt: '' }),
            createLine({ id: 5, page: 10, isFootnote: false, alt: '' }),
        ];
        storeState.savedIds = [42];

        render(
            <table>
                <tbody>
                    <ManuscriptTableHeader onSelectAll={() => {}} rows={rows} selection={[[], () => {}] as any} />
                </tbody>
            </table>,
        );

        fireEvent.click(screen.getByLabelText('Footnotes'));
        expect(storeState.filterByPages).toHaveBeenCalledWith([10]);

        fireEvent.click(screen.getByLabelText('Saved Rows'));
        expect(storeState.filterByIds).toHaveBeenCalledWith([42]);

        fireEvent.click(screen.getByLabelText('Filter Misaligned Observations'));
        expect(storeState.filterByPages).toHaveBeenCalledWith(expect.arrayContaining([10]));
    });
});
