import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';

mock.module('nanolytics', () => ({ record: jest.fn() }));

// Mock @dnd-kit
mock.module('@dnd-kit/sortable', () => ({
    useSortable: () => ({
        attributes: { 'aria-label': 'drag handle' },
        isDragging: false,
        listeners: {},
        setNodeRef: jest.fn(),
        transform: null,
        transition: null,
    }),
}));

mock.module('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }));

// Mock flappa-doormal
const mockSegmentPages = jest.fn();
mock.module('flappa-doormal', () => ({ segmentPages: mockSegmentPages }));

// Mock UI components
mock.module('@/components/ui/checkbox', () => ({
    Checkbox: ({ checked, onCheckedChange, id, className, ...props }: any) => (
        <input
            checked={checked}
            className={className}
            data-testid={id ? `checkbox-${id}` : 'selection-checkbox'}
            id={id}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            type="checkbox"
            {...props}
        />
    ),
}));

mock.module('@/components/ui/label', () => ({
    Label: ({ children, htmlFor, ...props }: any) => (
        <label htmlFor={htmlFor} {...props}>
            {children}
        </label>
    ),
}));

mock.module('@/components/ui/select', () => ({
    Select: ({ value, onValueChange, children }: any) => (
        <div data-testid="select" data-value={value}>
            {children}
        </div>
    ),
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
    SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

// Mock store
const mockUpdateRuleConfig = jest.fn();
const mockTogglePattern = jest.fn();

const mockStoreState = {
    togglePattern: mockTogglePattern,
    tokenMappings: [] as { token: string; name: string }[],
    updateRuleConfig: mockUpdateRuleConfig,
};

mock.module('@/stores/segmentationStore/useSegmentationStore', () => ({ useSegmentationStore: () => mockStoreState }));

import { SortableRuleCard } from './RuleCard';

describe('SortableRuleCard', () => {
    const baseRule = {
        fuzzy: false,
        metaType: 'none' as const,
        min: undefined,
        pageStartGuard: false,
        pattern: 'test-pattern',
        patternType: 'lineStartsAfter' as const,
        template: '{{bab}}',
    };

    beforeEach(() => {
        mockUpdateRuleConfig.mockReset();
        mockTogglePattern.mockReset();
        mockSegmentPages.mockReset();
        mockSegmentPages.mockReturnValue([]);
        mockStoreState.tokenMappings = [];
    });

    it('should render rule template in input field', () => {
        render(<SortableRuleCard id="test" index={0} rule={baseRule} />);

        const input = screen.getByDisplayValue('{{bab}}');
        expect(input).toBeDefined();
    });

    it('should call updateRuleConfig when template is changed', () => {
        render(<SortableRuleCard id="test" index={0} rule={baseRule} />);

        const input = screen.getByDisplayValue('{{bab}}');
        fireEvent.change(input, { target: { value: '{{fasl}}' } });

        expect(mockUpdateRuleConfig).toHaveBeenCalledWith(0, { template: '{{fasl}}' });
    });

    it('should render multiple template inputs for array templates', () => {
        const ruleWithArrayTemplate = { ...baseRule, template: ['{{bab}}', '{{fasl}}'] };

        render(<SortableRuleCard id="test" index={0} rule={ruleWithArrayTemplate} />);

        expect(screen.getByDisplayValue('{{bab}}')).toBeDefined();
        expect(screen.getByDisplayValue('{{fasl}}')).toBeDefined();
        expect(screen.getByText('1.')).toBeDefined();
        expect(screen.getByText('2.')).toBeDefined();
    });

    it('should update individual template in array when changed', () => {
        const ruleWithArrayTemplate = { ...baseRule, template: ['{{bab}}', '{{fasl}}'] };

        render(<SortableRuleCard id="test" index={0} rule={ruleWithArrayTemplate} />);

        const secondInput = screen.getByDisplayValue('{{fasl}}');
        fireEvent.change(secondInput, { target: { value: '{{kitab}}' } });

        expect(mockUpdateRuleConfig).toHaveBeenCalledWith(0, { template: ['{{bab}}', '{{kitab}}'] });
    });

    it('should call togglePattern when remove button is clicked', () => {
        render(<SortableRuleCard id="test" index={0} rule={baseRule} />);

        const removeButton = screen.getByTitle('Remove rule');
        fireEvent.click(removeButton);

        expect(mockTogglePattern).toHaveBeenCalledWith('test-pattern');
    });

    it('should render drag handle button', () => {
        render(<SortableRuleCard id="test" index={0} rule={baseRule} />);

        // The drag handle is a button with aria-label attribute from useSortable
        const dragHandle = screen.getByLabelText('drag handle');
        expect(dragHandle).toBeDefined();
    });

    it('should render fuzzy checkbox with correct state', () => {
        const fuzzyRule = { ...baseRule, fuzzy: true };

        render(<SortableRuleCard id="test" index={0} rule={fuzzyRule} />);

        const fuzzyCheckbox = screen.getByTestId('checkbox-fuzzy-0') as HTMLInputElement;
        expect(fuzzyCheckbox.checked).toBe(true);
    });

    it('should call updateRuleConfig when fuzzy checkbox is toggled', () => {
        render(<SortableRuleCard id="test" index={0} rule={baseRule} />);

        const fuzzyCheckbox = screen.getByTestId('checkbox-fuzzy-0');
        fireEvent.click(fuzzyCheckbox);

        expect(mockUpdateRuleConfig).toHaveBeenCalledWith(0, { fuzzy: true });
    });

    it('should render pageStartGuard checkbox with correct state', () => {
        const guardRule = { ...baseRule, pageStartGuard: true };

        render(<SortableRuleCard id="test" index={0} rule={guardRule} />);

        const guardCheckbox = screen.getByTestId('checkbox-pageGuard-0') as HTMLInputElement;
        expect(guardCheckbox.checked).toBe(true);
    });

    it('should call updateRuleConfig when pageStartGuard checkbox is toggled', () => {
        render(<SortableRuleCard id="test" index={0} rule={baseRule} />);

        const guardCheckbox = screen.getByTestId('checkbox-pageGuard-0');
        fireEvent.click(guardCheckbox);

        expect(mockUpdateRuleConfig).toHaveBeenCalledWith(0, { pageStartGuard: true });
    });

    it('should render selection checkbox when onSelect is provided', () => {
        const onSelect = jest.fn();

        render(<SortableRuleCard id="test" index={0} onSelect={onSelect} rule={baseRule} selected={false} />);

        const selectionCheckbox = screen.getByTestId('selection-checkbox');
        expect(selectionCheckbox).toBeDefined();
    });

    it('should call onSelect when selection checkbox is clicked', () => {
        const onSelect = jest.fn();

        render(<SortableRuleCard id="test" index={0} onSelect={onSelect} rule={baseRule} selected={false} />);

        const selectionCheckbox = screen.getByTestId('selection-checkbox');
        fireEvent.click(selectionCheckbox);

        expect(onSelect).toHaveBeenCalledWith('test-pattern', true);
    });

    it('should display selected state when selected prop is true', () => {
        const onSelect = jest.fn();

        render(<SortableRuleCard id="test" index={0} onSelect={onSelect} rule={baseRule} selected={true} />);

        const selectionCheckbox = screen.getByTestId('selection-checkbox') as HTMLInputElement;
        expect(selectionCheckbox.checked).toBe(true);
    });

    it('should display examples table when exampleLines are provided', () => {
        mockSegmentPages.mockReturnValue([{ content: 'Segmented content', meta: { type: 'chapter' } }]);

        render(<SortableRuleCard exampleLines={['Example line 1']} id="test" index={0} rule={baseRule} />);

        expect(screen.getByText('Example')).toBeDefined();
        expect(screen.getByText('Segment Result')).toBeDefined();
    });

    it('should render min input field', () => {
        render(<SortableRuleCard id="test" index={0} rule={baseRule} />);

        const minInput = screen.getByPlaceholderText('-');
        expect(minInput).toBeDefined();
    });

    it('should render min input with correct value when min is set', () => {
        const ruleWithMin = { ...baseRule, min: 5 };

        render(<SortableRuleCard id="test" index={0} rule={ruleWithMin} />);

        const minInput = screen.getByDisplayValue('5') as HTMLInputElement;
        expect(minInput.type).toBe('number');
    });

    it('should call updateRuleConfig when min value is changed', () => {
        render(<SortableRuleCard id="test" index={0} rule={baseRule} />);

        const minInput = screen.getByPlaceholderText('-');
        fireEvent.change(minInput, { target: { value: '3' } });

        expect(mockUpdateRuleConfig).toHaveBeenCalledWith(0, { min: 3 });
    });

    it('should clear min value when input is emptied', () => {
        const ruleWithMin = { ...baseRule, min: 5 };

        render(<SortableRuleCard id="test" index={0} rule={ruleWithMin} />);

        const minInput = screen.getByDisplayValue('5');
        fireEvent.change(minInput, { target: { value: '' } });

        expect(mockUpdateRuleConfig).toHaveBeenCalledWith(0, { min: undefined });
    });
});
