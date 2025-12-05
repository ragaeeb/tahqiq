import { describe, expect, it, jest, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';

mock.module('nanolytics', () => ({ record: jest.fn() }));

mock.module('@/components/ui/button', () => ({
    Button: ({ children, onClick, ...props }: any) => (
        <button onClick={onClick} type="button" {...props}>
            {children}
        </button>
    ),
}));

mock.module('@/components/ui/textarea', () => ({
    Textarea: ({ defaultValue, onBlur, onSelect, onMouseUp, placeholder, ...props }: any) => (
        <textarea
            defaultValue={defaultValue}
            onBlur={onBlur}
            onMouseDown={onMouseUp}
            onSelect={onSelect}
            placeholder={placeholder}
            {...props}
        />
    ),
}));

import ExcerptRow from './excerpt-row';

describe('ExcerptRow', () => {
    const mockData = { from: 1, id: 'E1', nass: 'النص العربي', text: 'Translation text', to: 2 } as any;

    it('renders excerpt data correctly', () => {
        render(
            <table>
                <tbody>
                    <ExcerptRow
                        data={mockData}
                        onCreateFromSelection={jest.fn()}
                        onDelete={jest.fn()}
                        onUpdate={jest.fn()}
                    />
                </tbody>
            </table>,
        );

        expect(screen.getByText('1-2')).toBeDefined();
        expect(screen.getByDisplayValue('النص العربي')).toBeDefined();
        expect(screen.getByDisplayValue('Translation text')).toBeDefined();
    });

    it('calls onDelete when delete button clicked', () => {
        const onDelete = jest.fn();

        render(
            <table>
                <tbody>
                    <ExcerptRow
                        data={mockData}
                        onCreateFromSelection={jest.fn()}
                        onDelete={onDelete}
                        onUpdate={jest.fn()}
                    />
                </tbody>
            </table>,
        );

        fireEvent.click(screen.getByRole('button', { name: /Delete excerpt E1/i }));

        expect(onDelete).toHaveBeenCalledWith('E1');
    });

    it('calls onUpdate when nass field loses focus with changed value', () => {
        const onUpdate = jest.fn();

        render(
            <table>
                <tbody>
                    <ExcerptRow
                        data={mockData}
                        onCreateFromSelection={jest.fn()}
                        onDelete={jest.fn()}
                        onUpdate={onUpdate}
                    />
                </tbody>
            </table>,
        );

        const nassTextarea = screen.getByDisplayValue('النص العربي');
        fireEvent.change(nassTextarea, { target: { value: 'نص جديد' } });
        fireEvent.blur(nassTextarea);

        expect(onUpdate).toHaveBeenCalledWith('E1', { nass: 'نص جديد' });
    });

    it('calls onUpdate when translation field loses focus with changed value', () => {
        const onUpdate = jest.fn();

        render(
            <table>
                <tbody>
                    <ExcerptRow
                        data={mockData}
                        onCreateFromSelection={jest.fn()}
                        onDelete={jest.fn()}
                        onUpdate={onUpdate}
                    />
                </tbody>
            </table>,
        );

        const textTextarea = screen.getByDisplayValue('Translation text');
        fireEvent.change(textTextarea, { target: { value: 'New translation' } });
        fireEvent.blur(textTextarea);

        expect(onUpdate).toHaveBeenCalledWith('E1', { text: 'New translation' });
    });

    it('displays page range correctly with only from value', () => {
        const dataWithOnlyFrom = { ...mockData, to: undefined };

        render(
            <table>
                <tbody>
                    <ExcerptRow
                        data={dataWithOnlyFrom}
                        onCreateFromSelection={jest.fn()}
                        onDelete={jest.fn()}
                        onUpdate={jest.fn()}
                    />
                </tbody>
            </table>,
        );

        expect(screen.getByText('1')).toBeDefined();
    });
});
