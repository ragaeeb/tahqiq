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
    Input: ({ defaultValue, onBlur, placeholder, type, ...props }: any) => (
        <input defaultValue={defaultValue} onBlur={onBlur} placeholder={placeholder} type={type || 'text'} {...props} />
    ),
}));

mock.module('@/components/ui/textarea', () => ({
    Textarea: ({ defaultValue, onBlur, placeholder, ...props }: any) => (
        <textarea defaultValue={defaultValue} onBlur={onBlur} placeholder={placeholder} {...props} />
    ),
}));

import HeadingRow from './heading-row';

describe('HeadingRow', () => {
    const mockData = { from: 5, id: 'H1', nass: 'عنوان الباب', text: 'Chapter title' } as any;

    it('renders heading data correctly', () => {
        render(
            <table>
                <tbody>
                    <HeadingRow data={mockData} onDelete={jest.fn()} onUpdate={jest.fn()} />
                </tbody>
            </table>,
        );

        expect(screen.getByDisplayValue('5')).toBeDefined();
        expect(screen.getByDisplayValue('عنوان الباب')).toBeDefined();
        expect(screen.getByDisplayValue('Chapter title')).toBeDefined();
    });

    it('calls onDelete when delete button clicked', () => {
        const onDelete = jest.fn();

        render(
            <table>
                <tbody>
                    <HeadingRow data={mockData} onDelete={onDelete} onUpdate={jest.fn()} />
                </tbody>
            </table>,
        );

        fireEvent.click(screen.getByRole('button', { name: /Delete heading H1/i }));

        expect(onDelete).toHaveBeenCalledWith('H1');
    });

    it('calls onUpdate when from field loses focus with changed value', () => {
        const onUpdate = jest.fn();

        render(
            <table>
                <tbody>
                    <HeadingRow data={mockData} onDelete={jest.fn()} onUpdate={onUpdate} />
                </tbody>
            </table>,
        );

        const fromInput = screen.getByDisplayValue('5');
        fireEvent.change(fromInput, { target: { value: '10' } });
        fireEvent.blur(fromInput);

        expect(onUpdate).toHaveBeenCalledWith('H1', { from: 10 });
    });

    it('calls onUpdate when nass field loses focus with changed value', () => {
        const onUpdate = jest.fn();

        render(
            <table>
                <tbody>
                    <HeadingRow data={mockData} onDelete={jest.fn()} onUpdate={onUpdate} />
                </tbody>
            </table>,
        );

        const nassTextarea = screen.getByDisplayValue('عنوان الباب');
        fireEvent.change(nassTextarea, { target: { value: 'عنوان جديد' } });
        fireEvent.blur(nassTextarea);

        expect(onUpdate).toHaveBeenCalledWith('H1', { nass: 'عنوان جديد' });
    });

    it('calls onUpdate when translation field loses focus with changed value', () => {
        const onUpdate = jest.fn();

        render(
            <table>
                <tbody>
                    <HeadingRow data={mockData} onDelete={jest.fn()} onUpdate={onUpdate} />
                </tbody>
            </table>,
        );

        const textTextarea = screen.getByDisplayValue('Chapter title');
        fireEvent.change(textTextarea, { target: { value: 'New chapter title' } });
        fireEvent.blur(textTextarea);

        expect(onUpdate).toHaveBeenCalledWith('H1', { text: 'New chapter title' });
    });
});
