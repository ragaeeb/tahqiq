import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';

mock.module('nanolytics', () => ({ record: jest.fn() }));

// Mock PatternChip
mock.module('@/components/PatternChip', () => ({
    PatternChip: ({ pattern, onAction, colorScheme, mode }: any) => (
        <button
            data-color={colorScheme}
            data-mode={mode}
            data-testid={`pattern-${pattern.pattern}`}
            onClick={onAction}
            type="button"
        >
            {pattern.pattern} ({pattern.count})
        </button>
    ),
}));

// Mock UI components
mock.module('@/components/ui/checkbox', () => ({
    Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
        <input
            checked={checked}
            data-testid="checkbox"
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            type="checkbox"
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

mock.module('@/components/ui/slider', () => ({
    Slider: ({ value, onValueChange, min, max, step, ...props }: any) => (
        <input
            data-testid="slider"
            max={max}
            min={min}
            onChange={(e) => onValueChange([parseInt(e.target.value, 10)])}
            step={step}
            type="range"
            value={value[0]}
            {...props}
        />
    ),
}));

mock.module('@/lib/segmentation', () => ({
    buildPatternTooltip: jest.fn((p) => `Tooltip: ${p.pattern}`),
    findSimilarPatterns: jest.fn(() => []),
}));

// Mock segmentation store
const mockTogglePattern = jest.fn();
const mockAddCommonPattern = jest.fn();

const mockStoreState = {
    allLineStarts: [] as any[],
    allRepeatingSequences: [] as any[],
    analysisMode: 'lineStarts',
    selectedPatterns: new Set<string>(),
};

const mockSetAnalysisMode = jest.fn();

const useSegmentationStore = () => ({
    addCommonPattern: mockAddCommonPattern,
    allLineStarts: mockStoreState.allLineStarts,
    allRepeatingSequences: mockStoreState.allRepeatingSequences,
    analysisMode: mockStoreState.analysisMode,
    selectedPatterns: mockStoreState.selectedPatterns,
    setAnalysisMode: mockSetAnalysisMode,
    togglePattern: mockTogglePattern,
});

mock.module('@/stores/segmentationStore/useSegmentationStore', () => ({ useSegmentationStore }));

import { PatternsTab } from './PatternsTab';

describe('PatternsTab', () => {
    beforeEach(() => {
        mockTogglePattern.mockReset();
        mockAddCommonPattern.mockReset();
        mockStoreState.allLineStarts = [];
        mockStoreState.allRepeatingSequences = [];
        mockStoreState.analysisMode = 'lineStarts';
        mockStoreState.selectedPatterns = new Set<string>();
    });

    it('should render empty state when no patterns are analyzed', () => {
        render(<PatternsTab detectedRules={[]} onRemoveDetectedRule={jest.fn()} />);

        expect(screen.getByText('Click "Analyze Pages" to detect common line start patterns')).toBeDefined();
    });

    it('should render slider controls with default values', () => {
        render(<PatternsTab detectedRules={[]} onRemoveDetectedRule={jest.fn()} />);

        const sliders = screen.getAllByTestId('slider');
        expect(sliders.length).toBe(2);
        expect(screen.getByText(/Top K:/)).toBeDefined();
        expect(screen.getByText(/Min Count:/)).toBeDefined();
    });

    it('should render patterns table when patterns exist', () => {
        mockStoreState.allLineStarts = [
            { count: 10, examples: [{ line: 'Example line', pageId: 1 }], pattern: 'Test Pattern' },
        ];

        render(<PatternsTab detectedRules={[]} onRemoveDetectedRule={jest.fn()} />);

        expect(screen.getByText('Test Pattern')).toBeDefined();
        expect(screen.getByText('10')).toBeDefined();
    });

    it('should toggle pattern selection when checkbox is clicked', () => {
        mockStoreState.allLineStarts = [{ count: 5, examples: [{ line: 'Line', pageId: 1 }], pattern: 'Pattern1' }];

        render(<PatternsTab detectedRules={[]} onRemoveDetectedRule={jest.fn()} />);

        const checkbox = screen.getByTestId('checkbox');
        fireEvent.click(checkbox);

        expect(mockTogglePattern).toHaveBeenCalledWith('Pattern1');
    });

    it('should display detected rules section when rules exist', () => {
        const detectedRules = [
            { fuzzy: true, metaType: 'chapter', patternType: 'lineStartsWith', template: '{{bab}}' },
        ];

        render(<PatternsTab detectedRules={detectedRules} onRemoveDetectedRule={jest.fn()} />);

        expect(screen.getByText('Rules from Selection (1)')).toBeDefined();
        expect(screen.getByText('{{bab}}')).toBeDefined();
        expect(screen.getByText('lineStartsWith')).toBeDefined();
        expect(screen.getByText('fuzzy')).toBeDefined();
    });

    it('should call onRemoveDetectedRule when remove button clicked', () => {
        const onRemoveDetectedRule = jest.fn();
        const detectedRules = [{ fuzzy: false, metaType: 'none', patternType: 'lineStartsAfter', template: 'Test' }];

        render(<PatternsTab detectedRules={detectedRules} onRemoveDetectedRule={onRemoveDetectedRule} />);

        const removeButton = screen.getByTitle('Remove rule');
        fireEvent.click(removeButton);

        expect(onRemoveDetectedRule).toHaveBeenCalledWith(0);
    });

    it('should display selected patterns section when patterns are selected', () => {
        mockStoreState.selectedPatterns = new Set(['Pattern1']);
        mockStoreState.allLineStarts = [{ count: 5, examples: [], pattern: 'Pattern1' }];

        render(<PatternsTab detectedRules={[]} onRemoveDetectedRule={jest.fn()} />);

        expect(screen.getByText('Selected Patterns (1)')).toBeDefined();
    });

    it('should filter patterns based on minimum count', () => {
        mockStoreState.allLineStarts = [
            { count: 1, examples: [{ line: 'Line1', pageId: 1 }], pattern: 'LowCount' },
            { count: 10, examples: [{ line: 'Line2', pageId: 2 }], pattern: 'HighCount' },
        ];

        render(<PatternsTab detectedRules={[]} onRemoveDetectedRule={jest.fn()} />);

        // Default minCount is 2, so LowCount should be filtered
        expect(screen.queryByText('LowCount')).toBeNull();
        expect(screen.getByText('HighCount')).toBeDefined();
    });

    it('should highlight selected patterns in the table', () => {
        mockStoreState.allLineStarts = [{ count: 5, examples: [{ line: 'Line', pageId: 1 }], pattern: 'Pattern1' }];
        mockStoreState.selectedPatterns = new Set(['Pattern1']);

        render(<PatternsTab detectedRules={[]} onRemoveDetectedRule={jest.fn()} />);

        const checkbox = screen.getByTestId('checkbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
    });
});
