import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, jest, mock } from 'bun:test';

const record = jest.fn();
const formattingCalls: string[] = [];

mock.module('nanolytics', () => ({
    record,
}));

mock.module('blumbaben', () => ({
    FormattingToolbar: ({ children }: { children: (cb: (fn: () => string) => void) => React.ReactNode }) => {
        return <div>{children((formatter) => formattingCalls.push(formatter()))}</div>;
    },
}));

mock.module('@/stores/settingsStore/useSettingsStore', () => ({
    useSettingsStore: (selector: any) => selector({ quickSubs: ['سبحان', 'الحمد'] }),
}));

import RowToolbar from './row-toolbar';

describe('RowToolbar', () => {
    it('renders quick substitution buttons and applies formatting callbacks', () => {
        render(<RowToolbar />);

        const button = screen.getByText('سبحان');
        fireEvent.click(button);

        expect(record).toHaveBeenCalledWith('QuickSub', 'سبحان');
        expect(formattingCalls).toContain('سبحان');
    });
});
