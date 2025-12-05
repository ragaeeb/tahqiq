import { describe, expect, it, jest, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';

mock.module('@/components/ui/button', () => ({
    Button: ({ children, onClick, ...props }: any) => (
        <button onClick={onClick} type="button" {...props}>
            {children}
        </button>
    ),
}));

mock.module('@/components/ui/input', () => ({
    Input: ({ defaultValue, onBlur, type, ...props }: any) => (
        <input defaultValue={defaultValue} onBlur={onBlur} type={type || 'text'} {...props} />
    ),
}));

mock.module('@/components/ui/textarea', () => ({
    Textarea: ({ defaultValue, onBlur, placeholder, ...props }: any) => (
        <textarea defaultValue={defaultValue} onBlur={onBlur} placeholder={placeholder} {...props} />
    ),
}));

import FootnoteRow from './footnote-row';

describe('FootnoteRow', () => {
    const mockData = { from: 10, id: 'F1', nass: 'الحاشية العربية', text: 'Footnote translation' } as any;

    it('renders footnote data correctly', () => {
        render(
            <table>
                <tbody>
                    <FootnoteRow data={mockData} onDelete={jest.fn()} onUpdate={jest.fn()} />
                </tbody>
            </table>,
        );

        expect(screen.getByDisplayValue('10')).toBeDefined();
        expect(screen.getByDisplayValue('الحاشية العربية')).toBeDefined();
        expect(screen.getByDisplayValue('Footnote translation')).toBeDefined();
    });

    it('calls onDelete when delete button clicked', () => {
        const onDelete = jest.fn();

        render(
            <table>
                <tbody>
                    <FootnoteRow data={mockData} onDelete={onDelete} onUpdate={jest.fn()} />
                </tbody>
            </table>,
        );

        fireEvent.click(screen.getByRole('button', { name: /Delete footnote F1/i }));

        expect(onDelete).toHaveBeenCalledWith('F1');
    });

    it('calls onUpdate when from field loses focus with changed value', () => {
        const onUpdate = jest.fn();

        render(
            <table>
                <tbody>
                    <FootnoteRow data={mockData} onDelete={jest.fn()} onUpdate={onUpdate} />
                </tbody>
            </table>,
        );

        const fromInput = screen.getByDisplayValue('10');
        fireEvent.change(fromInput, { target: { value: '15' } });
        fireEvent.blur(fromInput);

        expect(onUpdate).toHaveBeenCalledWith('F1', { from: 15 });
    });

    it('calls onUpdate when nass field loses focus with changed value', () => {
        const onUpdate = jest.fn();

        render(
            <table>
                <tbody>
                    <FootnoteRow data={mockData} onDelete={jest.fn()} onUpdate={onUpdate} />
                </tbody>
            </table>,
        );

        const nassTextarea = screen.getByDisplayValue('الحاشية العربية');
        fireEvent.change(nassTextarea, { target: { value: 'حاشية جديدة' } });
        fireEvent.blur(nassTextarea);

        expect(onUpdate).toHaveBeenCalledWith('F1', { nass: 'حاشية جديدة' });
    });

    it('calls onUpdate when translation field loses focus with changed value', () => {
        const onUpdate = jest.fn();

        render(
            <table>
                <tbody>
                    <FootnoteRow data={mockData} onDelete={jest.fn()} onUpdate={onUpdate} />
                </tbody>
            </table>,
        );

        const textTextarea = screen.getByDisplayValue('Footnote translation');
        fireEvent.change(textTextarea, { target: { value: 'New footnote translation' } });
        fireEvent.blur(textTextarea);

        expect(onUpdate).toHaveBeenCalledWith('F1', { text: 'New footnote translation' });
    });

    it('renders with placeholder when text is empty', () => {
        const dataWithoutText = { ...mockData, text: '' };

        render(
            <table>
                <tbody>
                    <FootnoteRow data={dataWithoutText} onDelete={jest.fn()} onUpdate={jest.fn()} />
                </tbody>
            </table>,
        );

        expect(screen.getByPlaceholderText('Footnote translation...')).toBeDefined();
    });
});
