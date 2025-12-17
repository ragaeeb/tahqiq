import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';

const record = jest.fn();
const storeState: any = { setUrl: jest.fn(), url: '' };

mock.module('nanolytics', () => ({ record }));

mock.module('@/stores/manuscriptStore/useManuscriptStore', () => ({
    useManuscriptStore: (selector: any) => selector(storeState),
}));

import { PdfDialog } from './pdf-modal';

describe('PdfDialog', () => {
    beforeEach(() => {
        storeState.setUrl = jest.fn();
        storeState.url = '';
        record.mockReset();
    });

    it('renders iframe when url is already set', () => {
        storeState.url = 'https://example.com/test.pdf';

        render(<PdfDialog onClose={() => {}} page={5} />);

        const iframe = screen.getByTitle('PDF Viewer - Page 5');
        expect(iframe?.getAttribute('src')).toContain('page=5');
    });

    it('accepts url input and stores value', () => {
        render(<PdfDialog onClose={() => {}} page={1} />);

        const input = screen.getByPlaceholderText('Enter PDF url...');
        fireEvent.change(input, { target: { value: 'https://docs.example/pdf' } });
        fireEvent.submit(input.closest('form')!);

        expect(record).toHaveBeenCalledWith('LoadPDF', 'https://docs.example/pdf');
        expect(storeState.setUrl).toHaveBeenCalledWith('https://docs.example/pdf');
    });
});
