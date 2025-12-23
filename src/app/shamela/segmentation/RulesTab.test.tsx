import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';

mock.module('nanolytics', () => ({ record: jest.fn() }));

// Mock @dnd-kit
mock.module('@dnd-kit/core', () => ({
    closestCenter: jest.fn(),
    DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
    KeyboardSensor: jest.fn(),
    PointerSensor: jest.fn(),
    useSensor: () => ({}),
    useSensors: () => [],
}));

mock.module('@dnd-kit/sortable', () => ({
    SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
    sortableKeyboardCoordinates: jest.fn(),
    useSortable: () => ({
        attributes: {},
        isDragging: false,
        listeners: {},
        setNodeRef: jest.fn(),
        transform: null,
        transition: null,
    }),
    verticalListSortingStrategy: {},
}));

mock.module('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }));

// Mock flappa-doormal
mock.module('flappa-doormal', () => ({ segmentPages: jest.fn(() => []) }));

// Mock UI components
mock.module('@/components/ui/button', () => ({
    Button: ({ children, onClick, disabled, ...props }: any) => (
        <button disabled={disabled} onClick={onClick} type="button" {...props}>
            {children}
        </button>
    ),
}));

mock.module('@/components/ui/checkbox', () => ({
    Checkbox: ({ checked, onCheckedChange, id, ...props }: any) => (
        <input
            checked={checked}
            data-testid={id || 'checkbox'}
            id={id}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            type="checkbox"
            {...props}
        />
    ),
}));

mock.module('@/components/ui/input', () => ({
    Input: ({ value, onChange, placeholder, ...props }: any) => (
        <input
            data-testid={`input-${placeholder || 'default'}`}
            onChange={onChange}
            placeholder={placeholder}
            value={value}
            {...props}
        />
    ),
}));

mock.module('@/components/ui/label', () => ({
    Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

mock.module('@/components/ui/scroll-area', () => ({
    ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
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
const mockMergeSelectedRules = jest.fn();
const mockMoveRule = jest.fn();
const mockSetSliceAtPunctuation = jest.fn();
const mockSortRulesByLength = jest.fn();
const mockSetTokenMappings = jest.fn();
const mockUpdateRuleConfig = jest.fn();
const mockTogglePattern = jest.fn();

const mockStoreState = {
    allLineStarts: [] as any[],
    mergeSelectedRules: mockMergeSelectedRules,
    moveRule: mockMoveRule,
    ruleConfigs: [] as any[],
    setSliceAtPunctuation: mockSetSliceAtPunctuation,
    setTokenMappings: mockSetTokenMappings,
    sliceAtPunctuation: true,
    sortRulesByLength: mockSortRulesByLength,
    togglePattern: mockTogglePattern,
    tokenMappings: [] as { token: string; name: string }[],
    updateRuleConfig: mockUpdateRuleConfig,
};

mock.module('@/stores/segmentationStore/useSegmentationStore', () => ({ useSegmentationStore: () => mockStoreState }));

import { RulesTab } from './RulesTab';

describe('RulesTab', () => {
    beforeEach(() => {
        mockMergeSelectedRules.mockReset();
        mockMoveRule.mockReset();
        mockSetSliceAtPunctuation.mockReset();
        mockSortRulesByLength.mockReset();
        mockSetTokenMappings.mockReset();
        mockUpdateRuleConfig.mockReset();
        mockTogglePattern.mockReset();
        mockStoreState.ruleConfigs = [];
        mockStoreState.sliceAtPunctuation = true;
        mockStoreState.tokenMappings = [];
        mockStoreState.allLineStarts = [];
    });

    it('should render empty state when no rules are configured', () => {
        render(<RulesTab />);

        expect(screen.getByText('Select patterns in the Patterns tab to create rules')).toBeDefined();
    });

    it('should render rule cards when rules exist', () => {
        mockStoreState.ruleConfigs = [
            {
                fuzzy: false,
                metaType: 'none',
                pattern: 'pattern1',
                patternType: 'lineStartsAfter',
                template: '{{bab}}',
            },
            {
                fuzzy: false,
                metaType: 'none',
                pattern: 'pattern2',
                patternType: 'lineStartsAfter',
                template: '{{fasl}}',
            },
        ];

        render(<RulesTab />);

        expect(screen.getByDisplayValue('{{bab}}')).toBeDefined();
        expect(screen.getByDisplayValue('{{fasl}}')).toBeDefined();
    });

    it('should render slice at punctuation checkbox with correct state', () => {
        mockStoreState.sliceAtPunctuation = true;

        render(<RulesTab />);

        const checkbox = screen.getByTestId('slice-punctuation') as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
    });

    it('should call setSliceAtPunctuation when checkbox is toggled', () => {
        render(<RulesTab />);

        const checkbox = screen.getByTestId('slice-punctuation');
        fireEvent.click(checkbox);

        expect(mockSetSliceAtPunctuation).toHaveBeenCalledWith(false);
    });

    it('should render sort by length button when multiple rules exist', () => {
        mockStoreState.ruleConfigs = [
            {
                fuzzy: false,
                metaType: 'none',
                pattern: 'pattern1',
                patternType: 'lineStartsAfter',
                template: '{{bab}}',
            },
            {
                fuzzy: false,
                metaType: 'none',
                pattern: 'pattern2',
                patternType: 'lineStartsAfter',
                template: '{{fasl}}',
            },
        ];

        render(<RulesTab />);

        expect(screen.getByText(/Sort by Length/)).toBeDefined();
    });

    it('should call sortRulesByLength when sort button is clicked', () => {
        mockStoreState.ruleConfigs = [
            {
                fuzzy: false,
                metaType: 'none',
                pattern: 'pattern1',
                patternType: 'lineStartsAfter',
                template: '{{bab}}',
            },
            {
                fuzzy: false,
                metaType: 'none',
                pattern: 'pattern2',
                patternType: 'lineStartsAfter',
                template: '{{fasl}}',
            },
        ];

        render(<RulesTab />);

        const sortButton = screen.getByText(/Sort by Length/);
        fireEvent.click(sortButton);

        expect(mockSortRulesByLength).toHaveBeenCalled();
    });

    it('should not render sort button when only one rule exists', () => {
        mockStoreState.ruleConfigs = [
            {
                fuzzy: false,
                metaType: 'none',
                pattern: 'pattern1',
                patternType: 'lineStartsAfter',
                template: '{{bab}}',
            },
        ];

        render(<RulesTab />);

        expect(screen.queryByText(/Sort by Length/)).toBeNull();
    });

    describe('TokenMappingsSection', () => {
        it('should render empty token mappings message when no mappings exist', () => {
            render(<RulesTab />);

            expect(screen.getByText('No mappings defined. Add mappings to auto-apply named groups.')).toBeDefined();
        });

        it('should render token mapping inputs when mappings exist', () => {
            mockStoreState.tokenMappings = [{ name: 'num', token: 'raqms' }];

            render(<RulesTab />);

            const tokenInput = screen.getByTestId('input-token') as HTMLInputElement;
            const nameInput = screen.getByTestId('input-name') as HTMLInputElement;

            expect(tokenInput.value).toBe('raqms');
            expect(nameInput.value).toBe('num');
        });

        it('should call setTokenMappings when add button is clicked', () => {
            mockStoreState.tokenMappings = [];

            render(<RulesTab />);

            // Find all buttons and click the one with "Add" text
            const buttons = screen.getAllByRole('button');
            const addButton = buttons.find((b) => b.textContent?.includes('Add'));
            expect(addButton).toBeDefined();

            if (addButton) {
                fireEvent.click(addButton);
            }

            expect(mockSetTokenMappings).toHaveBeenCalledWith([{ name: '', token: '' }]);
        });

        it('should update token mapping when token input changes', () => {
            mockStoreState.tokenMappings = [{ name: 'num', token: 'raqms' }];

            render(<RulesTab />);

            const tokenInput = screen.getByTestId('input-token');
            fireEvent.change(tokenInput, { target: { value: 'rumuz' } });

            expect(mockSetTokenMappings).toHaveBeenCalledWith([{ name: 'num', token: 'rumuz' }]);
        });

        it('should update token mapping when name input changes', () => {
            mockStoreState.tokenMappings = [{ name: 'num', token: 'raqms' }];

            render(<RulesTab />);

            const nameInput = screen.getByTestId('input-name');
            fireEvent.change(nameInput, { target: { value: 'hadith' } });

            expect(mockSetTokenMappings).toHaveBeenCalledWith([{ name: 'hadith', token: 'raqms' }]);
        });

        it('should remove mapping when remove button is clicked', () => {
            mockStoreState.tokenMappings = [{ name: 'num', token: 'raqms' }];

            render(<RulesTab />);

            // Find the remove button (small square button with X icon)
            const buttons = screen.getAllByRole('button');
            // Filter to buttons that have the size class for the remove button
            const removeButtons = buttons.filter((b) => b.className.includes('p-0'));
            expect(removeButtons.length).toBeGreaterThan(0);

            fireEvent.click(removeButtons[0]);

            // Verify setTokenMappings was called (with the mapping removed)
            expect(mockSetTokenMappings).toHaveBeenCalled();
        });
    });
});
