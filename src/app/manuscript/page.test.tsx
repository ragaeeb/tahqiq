import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';

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
});
