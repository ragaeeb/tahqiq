import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';

import type { SheetLine } from '@/stores/manuscriptStore/types';

const record = jest.fn();
const toast = { success: jest.fn() };

mock.module('nanolytics', () => ({
    record,
}));

mock.module('sonner', () => ({
    toast,
}));

mock.module('@/components/json-drop-zone', () => ({
    default: ({ description }: any) => <div data-testid="drop-zone">{description}</div>,
}));

mock.module('@/components/version-footer', () => ({
    default: () => <footer>version</footer>,
}));

mock.module('./toolbar', () => ({
    default: () => <div>toolbar</div>,
}));

mock.module('./table-header', () => ({
    default: ({ onSelectAll }: any) => (
        <tr>
            <th>
                <button data-testid="select-all" onClick={() => onSelectAll(true)} type="button">
                    select all
                </button>
            </th>
        </tr>
    ),
}));

mock.module('./table-body', () => ({
    default: ({ rows, selectedRows }: any) => (
        <div data-testid="table-body">
            {selectedRows.length} / {rows.length}
        </div>
    ),
}));

mock.module('./pdf-modal', () => ({
    PdfDialog: ({ page }: any) => <div>pdf {page}</div>,
}));

mock.module('./row-toolbar', () => ({
    default: () => <div>row-toolbar</div>,
}));

mock.module('@/stores/manuscriptStore/selectors', () => ({
    selectAllSheetLines: (state: any) => state.rows,
}));

mock.module('@/lib/io', () => ({
    loadCompressed: () => Promise.resolve(undefined),
    saveCompressed: jest.fn(),
}));

mock.module('@/lib/manuscript', () => ({
    mapManuscriptToJuz: () => ({}),
}));

mock.module('@/lib/domUtils', () => ({
    downloadFile: jest.fn(),
}));

const storeState: any = {
    init: jest.fn(),
    initFromJuz: jest.fn(),
    isInitialized: false,
    reset: jest.fn(),
    rows: [],
};

const useManuscriptStore = (selector: any) => selector(storeState);
useManuscriptStore.getState = () => storeState;

mock.module('@/stores/manuscriptStore/useManuscriptStore', () => ({
    useManuscriptStore,
}));

import ManuscriptPage from './page';

const createLine = (id: number, page: number): SheetLine => ({
    alt: 'alt',
    id,
    lastUpdate: Date.now(),
    page,
    text: `row-${id}`,
} as SheetLine);

describe('Manuscript page', () => {
    beforeEach(() => {
        storeState.isInitialized = false;
        storeState.rows = [];
        toast.success.mockReset();
    });

    it('asks users to upload data before initialization', () => {
        render(<ManuscriptPage />);
        expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
    });

    it('renders data tables when initialized and allows selecting rows', () => {
        storeState.isInitialized = true;
        storeState.rows = [createLine(1, 1), createLine(2, 2)];

        render(<ManuscriptPage />);

        const body = screen.getByTestId('table-body');
        expect(body).toHaveTextContent('0 / 2');

        fireEvent.click(screen.getByTestId('select-all'));
        expect(body).toHaveTextContent('2 / 2');
    });
});
