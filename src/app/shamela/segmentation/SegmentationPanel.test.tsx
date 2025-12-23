import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';

const toastMock = { error: jest.fn(), info: jest.fn(), success: jest.fn() };
const recordMock = jest.fn();
const routerPushMock = jest.fn();

mock.module('nanolytics', () => ({ record: recordMock }));
mock.module('sonner', () => ({ toast: toastMock }));

mock.module('next/navigation', () => ({ useRouter: () => ({ push: routerPushMock }) }));

// Mock flappa-doormal
const mockAnalyzeCommonLineStarts = jest.fn();
const mockAnalyzeTextForRule = jest.fn();
const mockExpandCompositeTokensInTemplate = jest.fn((p) => p);

mock.module('flappa-doormal', () => ({
    analyzeCommonLineStarts: mockAnalyzeCommonLineStarts,
    analyzeTextForRule: mockAnalyzeTextForRule,
    expandCompositeTokensInTemplate: mockExpandCompositeTokensInTemplate,
}));

// Mock shamela
mock.module('shamela', () => ({ convertContentToMarkdown: jest.fn((content) => content) }));

// Mock PanelContainer
mock.module('@/components/PanelContainer', () => ({
    PanelContainer: ({ children, onCloseClicked }: any) => (
        <div data-testid="panel-container">
            <button data-testid="close-panel" onClick={onCloseClicked} type="button">
                Close
            </button>
            {children}
        </div>
    ),
}));

// Mock UI components
mock.module('@/components/ui/button', () => ({
    Button: ({ children, onClick, disabled, variant, ...props }: any) => (
        <button data-variant={variant} disabled={disabled} onClick={onClick} type="button" {...props}>
            {children}
        </button>
    ),
}));

mock.module('@/components/ui/tabs', () => ({
    Tabs: ({ children, value, onValueChange }: any) => (
        <div data-testid="tabs" data-value={value}>
            {typeof children === 'function' ? children({ onValueChange, value }) : children}
        </div>
    ),
    TabsContent: ({ children, value }: any) => <div data-testid={`tab-content-${value}`}>{children}</div>,
    TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
    TabsTrigger: ({ children, value, disabled }: any) => (
        <button data-testid={`tab-${value}`} disabled={disabled} type="button">
            {children}
        </button>
    ),
}));

// Mock tab components
mock.module('./JsonTab', () => ({
    JsonTab: () => <div data-testid="json-tab-content">JSON Tab</div>,
    useJsonTextareaValue: () => jest.fn(() => JSON.stringify({ maxPages: 1, rules: [] })),
}));

mock.module('./PatternsTab', () => ({
    PatternsTab: ({ detectedRules, onRemoveDetectedRule }: any) => (
        <div data-testid="patterns-tab-content">
            Patterns Tab ({detectedRules.length} detected rules)
            {detectedRules.map((rule: any, idx: number) => (
                <button key={rule.template} onClick={() => onRemoveDetectedRule(idx)} type="button">
                    Remove {rule.template}
                </button>
            ))}
        </div>
    ),
}));

mock.module('./PreviewTab', () => ({ PreviewTab: () => <div data-testid="preview-tab-content">Preview Tab</div> }));

mock.module('./ReplacementsTab', () => ({
    ReplacementsTab: () => <div data-testid="replacements-tab-content">Replacements Tab</div>,
}));

mock.module('./RulesTab', () => ({ RulesTab: () => <div data-testid="rules-tab-content">Rules Tab</div> }));

// Mock transform
mock.module('@/lib/transform/excerpts', () => ({
    segmentShamelaPagesToExcerpts: jest.fn(() => ({ excerpts: [{ id: 'E1' }] })),
}));

// Mock stores
const mockSegmentationState = {
    allLineStarts: [] as any[],
    replacements: [],
    ruleConfigs: [] as any[],
    setAllLineStarts: jest.fn(),
};

const mockShamelaState = { pages: [{ body: 'Test page', id: 1 }], titles: [] };

const mockExcerptsInit = jest.fn();

mock.module('@/stores/segmentationStore/useSegmentationStore', () => ({
    useSegmentationStore: () => mockSegmentationState,
}));

mock.module('@/stores/shamelaStore/useShamelaStore', () => ({ useShamelaStore: { getState: () => mockShamelaState } }));

mock.module('@/stores/excerptsStore/useExcerptsStore', () => ({
    useExcerptsStore: { getState: () => ({ init: mockExcerptsInit }) },
}));

import { SegmentationPanel } from './SegmentationPanel';

describe('SegmentationPanel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        recordMock.mockReset();
        toastMock.success.mockReset();
        toastMock.error.mockReset();
        toastMock.info.mockReset();
        routerPushMock.mockReset();
        mockSegmentationState.allLineStarts = [];
        mockSegmentationState.ruleConfigs = [];
        mockAnalyzeCommonLineStarts.mockReturnValue([]);
    });

    it('should render panel container with tabs', () => {
        render(<SegmentationPanel onClose={jest.fn()} />);

        expect(screen.getByTestId('panel-container')).toBeDefined();
        expect(screen.getByTestId('tabs')).toBeDefined();
    });

    it('should render all tab triggers', () => {
        render(<SegmentationPanel onClose={jest.fn()} />);

        expect(screen.getByTestId('tab-patterns')).toBeDefined();
        expect(screen.getByTestId('tab-rules')).toBeDefined();
        expect(screen.getByTestId('tab-replacements')).toBeDefined();
        expect(screen.getByTestId('tab-preview')).toBeDefined();
        expect(screen.getByTestId('tab-json')).toBeDefined();
    });

    it('should disable preview tab when no rules are configured', () => {
        mockSegmentationState.ruleConfigs = [];

        render(<SegmentationPanel onClose={jest.fn()} />);

        const previewTab = screen.getByTestId('tab-preview');
        expect(previewTab.hasAttribute('disabled')).toBe(true);
    });

    it('should enable preview tab when rules are configured', () => {
        mockSegmentationState.ruleConfigs = [
            { fuzzy: false, metaType: 'none', pattern: 'test', patternType: 'lineStartsAfter', template: 'test' },
        ];

        render(<SegmentationPanel onClose={jest.fn()} />);

        const previewTab = screen.getByTestId('tab-preview');
        expect(previewTab.disabled).toBe(false);
    });

    it('should call onClose when Cancel button is clicked', () => {
        const onClose = jest.fn();

        render(<SegmentationPanel onClose={onClose} />);

        fireEvent.click(screen.getByText('Cancel'));

        expect(onClose).toHaveBeenCalled();
    });

    it('should render Analyze Pages button on patterns tab', () => {
        render(<SegmentationPanel onClose={jest.fn()} />);

        expect(screen.getByText('Analyze Pages')).toBeDefined();
    });

    it('should render Add from Selection button on patterns tab', () => {
        render(<SegmentationPanel onClose={jest.fn()} />);

        expect(screen.getByText(/Add from Selection/)).toBeDefined();
    });

    it('should display pattern count in patterns tab trigger', () => {
        mockSegmentationState.allLineStarts = [{ count: 1, examples: [], pattern: 'test' }];

        render(<SegmentationPanel onClose={jest.fn()} />);

        expect(screen.getByText('Patterns (1)')).toBeDefined();
    });

    it('should display rules count in rules tab trigger', () => {
        mockSegmentationState.ruleConfigs = [
            { fuzzy: false, metaType: 'none', pattern: 'test', patternType: 'lineStartsAfter', template: 'test' },
        ];

        render(<SegmentationPanel onClose={jest.fn()} />);

        expect(screen.getByText('Rules (1)')).toBeDefined();
    });

    it('should auto-analyze on first render when no patterns exist', async () => {
        mockAnalyzeCommonLineStarts.mockReturnValue([{ count: 5, examples: [], pattern: 'detected' }]);

        render(<SegmentationPanel onClose={jest.fn()} />);

        // Wait for useEffect
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(recordMock).toHaveBeenCalledWith('AnalyzeLineStarts');
        expect(mockSegmentationState.setAllLineStarts).toHaveBeenCalled();
    });

    it('should show error toast when Add from Selection fails with no selection', () => {
        // Mock window.getSelection to return empty
        const originalGetSelection = window.getSelection;
        window.getSelection = () => ({ toString: () => '' }) as Selection;

        render(<SegmentationPanel onClose={jest.fn()} />);

        fireEvent.click(screen.getByText(/Add from Selection/));

        expect(toastMock.error).toHaveBeenCalledWith('Please select text from the Shamela page first');

        window.getSelection = originalGetSelection;
    });
});
