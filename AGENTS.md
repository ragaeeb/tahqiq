# Tahqiq Agent Guidelines

Welcome! This document provides comprehensive information for AI agents contributing to this repository.

## Quick Start

1. **Install dependencies**: `bun install`
2. **Run tests**: `bun test --coverage`
3. **Build for production**: `bun run build`
4. **Development server**: `bun run dev`

---

## Project Overview

Tahqiq is a Next.js-based application for managing and translating Islamic manuscripts and texts. It provides tools for:

- **Manuscript processing**: Editing, formatting, and correcting Arabic manuscript scans
- **Transcript management**: Working with audio transcriptions for lecture content
- **Excerpts management**: Organizing translated excerpts with filtering, search/replace, and virtualized lists
- **Shamela editor**: Importing and editing Shamela library books with powerful pattern-based segmentation
- **Book compilation**: Converting manuscripts to publishable book format with table of contents
- **Book browsing**: Static generation of browsable Islamic texts (Qur'an, Hadith collections)
- **Settings management**: API key configuration for Gemini and Shamela services

---

## Architecture

### Directory Structure

```text
src/
├── app/                    # Next.js App Router pages and components
│   ├── ajza/               # Manage groups of Juz for manuscript workflow
│   ├── api/                # API routes (translate, shamela, analytics, rules)
│   ├── book/               # Book browser and management
│   ├── excerpts/           # Excerpts, headings, footnotes management
│   ├── ketab/              # Ketab-online book editor
│   ├── manuscript/         # Manuscript editing interface
│   ├── settings/           # API key and configuration management
│   ├── shamela/            # Shamela book editor
│   ├── transcript/         # Audio transcript editing
│   └── web/                # Web content editor (scraped scholar content)
├── components/             # Shared React components
│   ├── segmentation/       # Shared segmentation panel components
│   ├── hooks/              # Custom React hooks
│   └── ui/                 # UI primitives (shadcn/ui style)
├── lib/                    # Utility functions and helpers
├── stores/                 # Zustand state management stores
│   ├── bookStore/          # Book compilation state (Kitab format)
│   ├── excerptsStore/      # Excerpts, headings, footnotes state
│   ├── ketabStore/         # Ketab Online book state
│   ├── manuscriptStore/    # Manuscript editing state
│   ├── patchStore/         # Page edit diffs for version control
│   ├── segmentationStore/  # Segmentation panel state (rules, patterns, replacements)
│   ├── settingsStore/      # App settings and API keys
│   ├── shamelaStore/       # Shamela book editing state
│   ├── transcriptStore/    # Transcript editing state
│   └── webStore/           # Web content editing state
├── test-utils/             # Testing utilities and helpers
└── types/                  # TypeScript type definitions
```

### State Management

We use **Zustand** with **Immer middleware** for immutable state updates:

```typescript
// Store pattern (see src/stores/excerptsStore/)
├── types.ts           # State and action type definitions
├── actions.ts         # Pure action functions (operate on state via Immer)
├── actions.test.ts    # Unit tests for pure state logic
├── selectors.ts       # Memoized selectors for derived state
├── useExcerptsStore.ts # Zustand store with Immer middleware
└── useExcerptsStore.test.ts # Integration tests
```

**Key patterns:**
- Use `zustand/middleware/immer` for immutable updates (NOT `mutative`)
- **Immer + Map/Set**: If using `Map` or `Set` in state (e.g., `sentToLlmIds`), you MUST call `enableMapSet()` in the store file initialization:
  ```typescript
  import { enableMapSet } from 'immer';
  enableMapSet();
  ```
- Actions are pure functions that mutate draft state (Immer handles immutability)
- Store wraps actions with `set((state) => actions.fn(state, ...args))`
- Selectors use `memoize-one` for performance
- Filter state (e.g., `filteredExcerptIds`) coexists with full data

**Store setup example:**
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useMyStore = create<MyState>()(
    immer((set) => ({
        ...INITIAL_STATE,
        myAction: (id) => set((state) => {
            // Mutate state directly - Immer handles immutability
            state.items = state.items.filter(i => i.id !== id);
        }),
    }))
);
```

### Settings Store

The settings store (`src/stores/settingsStore/`) manages persisted configuration:

-   **Hydration pattern**: Initialize with empty defaults, call `hydrate()` in `useEffect` to avoid SSR mismatch
-   **Encryption**: API keys are base64-encoded before storing in localStorage
-   **Settings**: Gemini API keys, Shamela API key/endpoint, quick substitutions

---

## Coding Conventions

### TypeScript
- Use `type` over `interface` for data shapes
- Prefer discriminated unions for type safety
- Use path alias `@/` for imports from `src/`

### React Components
- Use functional components with hooks
- Memoize expensive components with `React.memo`
- Use `defaultValue` for uncontrolled inputs that save on blur
- Prefer `useCallback` and `useMemo` for performance

### Dialog Pattern

Use `DialogTriggerButton` from `@/components/ui/dialog-trigger` for lazy-loaded dialog content:

```tsx
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';

<DialogTriggerButton
    onClick={() => record('OpenDialog')}
    renderContent={() => {
        const selectedText = getSelectedText(); // Capture at open time
        return <MyDialogContent initialValue={selectedText} onClose={() => setIsOpen(false)} />;
    }}
    size="sm"
    variant="outline"
>
    Open Dialog
</DialogTriggerButton>
```

This pattern:
1.  Captures data (like selected text) when dialog opens via `renderContent`
2.  Lazily renders content only when opened
3.  Passes data as props to the content component
4.  Supports `onClose` callback for programmatic closing

**Dialog Sizing:**

For large dialogs that need to stretch horizontally, use `!max-w-[90vw]` to override the default max-width:

```tsx
// In your DialogContent component:
<DialogContent className="!max-w-[90vw] flex h-[85vh] w-[90vw] flex-col">
    {/* Dialog content */}
</DialogContent>
```

The `!` prefix applies `!important` to override ShadCN's default `sm:max-w-lg` constraint.

### Unified Tabbed Dialogs

To consolidate related workflows (e.g., Exporting vs. Importing), use a single `DialogContent` with a `Tabs` component:

```tsx
// See src/app/excerpts/translation-dialog.tsx
export function UnifiedDialog({ defaultTab = 'tab1' }) {
    return (
        <DialogContent className="!max-w-[90vw] h-[85vh] w-[90vw]">
            <Tabs defaultValue={defaultTab}>
                <TabsList>
                    <TabsTrigger value="tab1">Export</TabsTrigger>
                    <TabsTrigger value="tab2">Import</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1"><ExportTab /></TabsContent>
                <TabsContent value="tab2"><ImportTab /></TabsContent>
            </Tabs>
        </DialogContent>
    );
}
```

**Benefits:**
- Reduced complexity for users (one dialog for the whole "workflow").
- Shared context (e.g., selected IDs can persist while switching tabs).
- Multiple entry points can open the same dialog to different tabs via `defaultTab` prop.

### ShadCN Components

**Always prefer ShadCN UI components from `@/components/ui/` over vanilla HTML elements:**

| Instead of | Use |
|------------|-----|
| `<button>` | `<Button>` from `@/components/ui/button` |
| `<input>` | `<Input>` from `@/components/ui/input` |
| `<textarea>` | `<Textarea>` from `@/components/ui/textarea` |
| `<select>` | `<Select>` from `@/components/ui/select` |
| Modal/popup | `<Dialog>` from `@/components/ui/dialog` |
| Checkboxes | `<Checkbox>` from `@/components/ui/checkbox` |
| Radio buttons | `<RadioGroup>` from `@/components/ui/radio-group` |
| Labels | `<Label>` from `@/components/ui/label` |

### Currently Available Components

The following components are already installed in `src/components/ui`:

- `Badge` (`badge.tsx`)
- `Button` (`button.tsx`)
- `Card` (`card.tsx`)
- `Checkbox` (`checkbox.tsx`)
- `Dialog` (`dialog.tsx`)
- `DialogTriggerButton` (`dialog-trigger.tsx`) - Custom helper
- `DropdownMenu` (`dropdown-menu.tsx`)
- `Input` (`input.tsx`)
- `Label` (`label.tsx`)
- `RadioGroup` (`radio-group.tsx`)
- `ScrollArea` (`scroll-area.tsx`)
- `Select` (`select.tsx`)
- `Slider` (`slider.tsx`)
- `Sonner` (`sonner.tsx`) - Toast notifications
- `Tabs` (`tabs.tsx`)
- `TagInput` (`tag-input.tsx`)
- `Textarea` (`textarea.tsx`)
- `Toggle` (`toggle.tsx`)
- `ToggleGroup` (`toggle-group.tsx`)

**Constants:**

Shared constants like `TRANSLATION_MODELS` live in `@/lib/constants.ts` and should be imported from there.

### Virtualization
For long lists, use `@tanstack/react-virtual`:

```tsx
// See src/app/excerpts/virtualized-list.tsx
// Key patterns:
// - Separate scroll container from virtualizer content
// - Use dataVersion key to force remount on data changes
// - Use initialOffset + useLayoutEffect for flash-free scroll restoration
```

---

## Testing

### Test Framework
-   **Bun test runner** with `happy-dom` environment
-   **@testing-library/react** for component testing
-   Tests live alongside source files: `component.tsx` → `component.test.tsx`

### Mocking Patterns

```tsx
// Mock external modules before imports
import { describe, expect, it, jest, mock } from 'bun:test';

mock.module('nanolytics', () => ({
    record: jest.fn(),
}));

mock.module('@/components/ui/button', () => ({
    Button: ({ children, onClick, ...props }: any) => (
        <button onClick={onClick} type="button" {...props}>
            {children}
        </button>
    ),
}));

// Import component AFTER mocks
import MyComponent from './my-component';

// CRITICAL: If you create a NEW component that is used by an existing component, 
// you MUST add a mock for it in the existing component's test file.
// Failure to do so will cause "Module not found" or resolution errors in Bun Test.
mock.module('./new-component', () => ({
    NewComponent: () => <div>Mock</div>,
}));
```

### Test Utilities

```typescript
// Reset store state between tests
import { resetExcerptsStoreState } from '@/test-utils/excerptsStore';

beforeEach(() => resetExcerptsStoreState());
afterEach(() => resetExcerptsStoreState());
```

### Running Tests

```bash
bun test                          # All tests
bun test src/stores/              # Store tests only
bun test src/app/excerpts/        # Component tests only
bun test --coverage               # With coverage
```

---

## Data Types

### Core Excerpt Types

```typescript
type Excerpt = {
    id: string;          // Unique identifier
    from: number;        // Starting page number
    to?: number;         // Optional ending page number
    nass?: string;       // Arabic text
    text?: string;       // Translation
    vol?: number;        // Volume number
    vp?: number;         // Volume page
    lastUpdatedAt?: number;
    translator?: number; // Translator ID
};

type ExcerptsStateCore = {
    // ... other core fields
    sentToLlmIds: Set<string>; // IDs of excerpts sent to LLM for translation
};

type Heading = Excerpt & {
    parent?: string;     // Parent heading ID for hierarchy
};

type Excerpts = {
    contractVersion: string;
    excerpts: Excerpt[];
    headings: Heading[];
    footnotes: Excerpt[];
    collection?: Collection;
    // ... other metadata
};
```

### Filter State

```typescript
// Filters are arrays of IDs, undefined means "show all"
type FilterState = {
    filteredExcerptIds?: string[];
    filteredHeadingIds?: string[];
    filteredFootnoteIds?: string[];
};
```

---

## Key Libraries

| Library | Purpose |
|---------|---------|
| `next` | App Router, SSG, API routes |
| `zustand` + `immer` | State management with immutable updates |
| `@tanstack/react-virtual` | Virtualized lists |
| `@radix-ui/*` | Accessible UI primitives |
| `shamela` | Shamela library book downloading and parsing |
| `sonner` | Toast notifications |
| `nanolytics` | Event analytics |
| `memoize-one` | Selector memoization |
| `baburchi` | Arabic text processing (normalization, sanitization) |
| `bitaboom` | Text cleanup pipeline (punctuation, spacing) |
| `flappa-doormal` | Pattern-based segmentation logic |

### API Routes

| Route | Method | Purpose |
|-------|--------|--------|
| `/api/shamela` | GET | Download book from Shamela (requires auth header) |
| `/api/translate` | POST | Translate text via Google Gemini |
| `/api/analytics` | POST | Record analytics events |
| `/api/rules` | GET | Fetch manuscript correction rules |

---

## Accessibility

-   Provide meaningful `aria-label` attributes for buttons
-   Use semantic HTML elements
-   Ensure keyboard navigation works
-   Test with screen readers when possible

---

## Code Style

-   **Linting**: Biome (configured in `biome.json`)
-   **Formatting**: Biome with 4-space indentation
-   **Import order**: Sorted automatically

Run checks:
```bash
bunx biome check --apply .    # Lint and format
bun run build                  # TypeScript + production build
```

---

## Common Tasks

### Adding a New Store Action

1.  Add type to `types.ts`
2.  Implement pure function in `actions.ts`
3.  Wire into store in `useXxxStore.ts`
4.  Add tests in `actions.test.ts` and `useXxxStore.test.ts`

### Adding a New Component

1.  Create `component-name.tsx` with props interface
2.  Export with `React.memo` if expensive
3.  Add `component-name.test.tsx` with mock setup
4.  Import from parent and wire handlers

### Adding URL-Based State

See `src/app/excerpts/use-excerpt-filters.ts` for pattern:
-   Read from `useSearchParams()`
-   Update with `router.replace()`
-   Apply side effects in `useEffect`

### URL Hash Scrolling Pattern

For scroll-to-row navigation via URL hash (e.g., `/excerpts#2333`):

```tsx
// In filter hook (use-excerpt-filters.ts):
const [scrollToFrom, setScrollToFrom] = useState<number | null>(null);

useEffect(() => {
    const readHash = () => {
        const hash = window.location.hash.slice(1);
        if (hash) {
            const value = Number.parseInt(hash, 10);
            if (!Number.isNaN(value)) setScrollToFrom(value);
        }
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
}, []);

// In VirtualizedList, use findScrollIndex for custom matching:
<VirtualizedList
    scrollToId={scrollToFrom}
    findScrollIndex={(data, value) => data.findIndex(item => item.from === value)}
    onScrollToComplete={clearScrollTo}
/>
```

### Adding Segmentation Rules

The segmentation panel (`src/components/segmentation/`) uses [flappa-doormal](https://github.com/ragaeeb/flappa-doormal) for pattern-based page segmentation.

**Store structure** (`src/stores/segmentationStore/types.ts`):
```typescript
type RuleConfig = {
    pattern: string;              // Original pattern (immutable)
    template: string | string[];  // Editable, can be array for merged rules
    patternType: 'lineStartsWith' | 'lineStartsAfter' | 'template';
    fuzzy: boolean;               // Diacritic-insensitive matching
    pageStartGuard: boolean;      // Skip matches at page boundaries
    metaType: 'B' | 'C';
    min?: number;                 // Minimum page number
};

// Uses ReplaceRule from flappa-doormal for replacements
type ReplaceRule = {
    regex: string;       // Raw regex pattern
    replacement: string; // Replacement text
    flags?: string;
};
```

**Panel tabs**:
- `AnalysisTab`: Line-start pattern analysis with auto-detection
- `RulesTab`: Rule configuration with drag & drop, merge, and specificity sorting
- `ReplacementsTab`: Pre-processing regex replacements with live match counts
- `PreviewTab`: Live virtualized preview of segmentation results
- `JsonTab`: Raw JSON options editor with validation reporting

**Key patterns**:
- Uncontrolled inputs with `defaultValue` + `onBlur` to avoid re-renders
- `useMemo` for expensive computations (match counts, segment preview)
- Store persists across panel open/close cycles

---

## Performance Tips

1. Use `key` props to force component remount when needed
2. Memoize expensive selectors
3. Use virtualization for lists > 100 items
4. Prefer `defaultValue` over controlled inputs when possible
5. Use `useLayoutEffect` for synchronous DOM mutations

---

Following these practices keeps the codebase maintainable and test-friendly for all contributors.

---

## Bulk Operations

For operations that may process thousands of items:

4. **Memoize list items** in virtualized loops to prevent re-rendering identical rows during filter/selection changes.

See `src/stores/excerptsStore/actions.ts` `applyBulkTranslations` or `TranslationPickerDialogContent` for lookup patterns:

```typescript
// Build index map for O(1) lookup
const excerptMap = useMemo(() => {
    const map = new Map<string, Excerpt>();
    for (const e of excerpts) map.set(e.id, e);
    return map;
}, [excerpts]);

// Access via ID instead of .find()
const selectedData = selectedIds.map(id => excerptMap.get(id));
```

Parsing utilities for bulk data live in `@/lib/segmentation.ts` or `@/lib/textUtils.ts`.

---

## Token Estimation

For LLM-based translation workflows, we use a custom Arabic-aware token estimation heuristic in `src/lib/textUtils.ts`.

### Logic
Standard whitespace-based or character-based counting is inaccurate for Arabic due to diacritics (tashkeel) and tatweel. Our `estimateTokenCount` function uses the following character-to-token ratios:

- **Arabic Diacritics (Tashkeel)**: ~1 token per character (high entropy/cost)
- **Tatweel (Elongation)**: ~1 token per character
- **Arabic-Indic Numerals**: ~4 characters per token
- **Base Arabic Characters**: ~2.5 characters per token
- **Latin/Other (Punctuation, Western Numerals)**: ~4 characters per token

This provides a conservative upper bound for models like Gemini, which can be highly sensitive to diacritics in their output generation and token limits.

---

## Tooling Patterns

### Unified Translation Workflow

The translation workflow is consolidated into a single tabbed dialog containing two main components:

- **PickerTab** (`src/app/excerpts/picker-tab.tsx`): Selecting untranslated excerpts.
- **AddTranslationTab** (`src/app/excerpts/add-translation-tab.tsx`): Applying pasted translations.

**Key features:**
- **State Sync**: Uses `sentToLlmIds` from the store to hide segments already "sent" in the current session.
- **Selection Logic**: Clicking a segment pill selects a range from the first visible segment to the clicked one.
- **Copy & Mark**: "Copy" formats for LLM. "Copy + Use" marks them as sent to hide them from the picker's current view.
- **ID Matching**: Multi-line paste in the "Add" tab automatically matches translations to excerpt IDs using regex.
- **Validation**: Real-time validation of pasted text against the current store's expected IDs to catch hallucinated markers.

---

## Session Persistence Hooks

Common patterns for OPFS session storage are abstracted into reusable hooks in `@/components/hooks/`:

### `useSessionRestore`

Restores data from OPFS on component mount:

```tsx
import { useSessionRestore } from '@/components/hooks/use-session-restore';
import { STORAGE_KEYS } from '@/lib/constants';

// Basic usage
useSessionRestore(STORAGE_KEYS.excerpts, init, 'RestoreExcerptsFromSession');

// With legacy data adapter
useSessionRestore(STORAGE_KEYS.transcript, init, 'RestoreTranscriptFromSession', adaptLegacyTranscripts);
```

### `useStorageActions`

Provides save/download/reset handlers with consistent behavior:

```tsx
import { useStorageActions } from '@/components/hooks/use-storage-actions';
import { STORAGE_KEYS } from '@/lib/constants';

const { handleSave, handleDownload, handleReset } = useStorageActions({
    storageKey: STORAGE_KEYS.excerpts,
    getExportData: () => mapStateToExport(useMyStore.getState()),
    reset: () => useMyStore.getState().reset(),
    analytics: { save: 'SaveExcerpts', download: 'DownloadExcerpts', reset: 'ResetExcerpts' },
});
```

**Key behaviors:**
- `handleSave`: Saves to OPFS, shows toast, falls back to download on error
- `handleDownload`: Prompts for filename, auto-appends `.json`
- `handleReset`: Clears OPFS storage AND resets store state

**Storage keys** are centralized in `STORAGE_KEYS` constant in `@/lib/constants.ts` to avoid typos.

### Hook Performance Lessons: Infinite Loops
When creating custom hooks that accept callbacks (like `init` in `useSessionRestore`), **NEVER** put the raw callback in the `useEffect` dependency array if the user is likely to pass an inline function (e.g., `(data) => setPrompts(data)`). This causes infinite loops as a new function reference is created on every render.

**Pattern: The Ref-Callback**
```typescript
export function useMyHook(callback: (data: any) => void) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback; // Keep ref updated

    useEffect(() => {
        // ... async logic ...
        callbackRef.current(data); // Call via ref
    }, [/* only stable dependencies here */]);
}
```

---

## Store Utilities

Common store operations are abstracted in `@/lib/store-utils.ts`:

```typescript
import { updateItemById, deleteItemsByIds, applyBulkFieldFormatting, buildIdIndexMap } from '@/lib/store-utils';

// Update a single item by ID (Immer-compatible)
updateItemById(state.excerpts, 'excerpt-123', { text: 'Updated text' });

// Delete multiple items by ID set
deleteItemsByIds(state.excerpts, idsToDelete);

// Apply transformation to a field across all items
applyBulkFieldFormatting(state.excerpts, 'nass', formatArabicText, currentTimestamp);

// Build O(1) lookup map for performance
const indexMap = buildIdIndexMap(state.excerpts);
```

**Time utility** in `@/lib/time.ts`:
```typescript
import { nowInSeconds } from '@/lib/time';
const timestamp = nowInSeconds(); // Unix timestamp in seconds (not ms)
```

---

## Table Components

Tables are domain-specific and NOT abstracted into a shared component (intentionally):

| Page | Implementation | Notes |
|------|---------------|-------|
| Excerpts | `VirtualizedList` (generic) | Reusable, supports scroll-to-id |
| Shamela | `VirtualizedList` | Same component as Excerpts |
| Manuscript | Custom virtualized body | Has page-break handling, dynamic row heights |
| Book/Transcript | Static `<table>` | Simple data, no virtualization needed |

**VirtualizedList** (`src/app/excerpts/virtualized-list.tsx`) is the shared component for large lists. Table headers remain domain-specific due to different filters and actions.

## Important

- **Unit Testing**: Always use the `it('should...')` convention for test descriptions to ensure clear, behavioral expectations.
- **Package Manager**: NEVER use `npm`; always use `bun` for installing and running commands.
- **Dev Server**: NEVER run `bun dev` yourself and launch the browser; always prompt the user to do so for testing.
- **Conciseness**: Respond in a concise manner; do not provide more information than necessary unless explicitly asked.

---

## Creating a New Route (like /web)

When creating a new route similar to existing ones (shamela, ketab, web), follow this pattern:

### 1. Store Layer (TDD)

Create in `src/stores/newStore/`:

```text
├── types.ts           # State and action types
├── actions.ts         # Pure action functions
├── actions.test.ts    # TDD tests (write first!)
├── selectors.ts       # Memoized selectors
└── useNewStore.ts     # Zustand store with Immer
```

**Key patterns:**
- Map input JSON fields to internal types (e.g., `page` → `id`, `body` → `content`)
- Use optional chaining for optional fields: `...(p.title && { title: p.title })`
- Add storage key to `STORAGE_KEYS` in `@/lib/constants.ts`

### 2. Transform Layer

Data transformation logic should be implemented in specialized utility files in `src/lib/` (e.g., `textUtils.ts`, `segmentation.ts`, `legacy.ts`). Write unit tests for all transformation logic.

**Note:** The `sanitizeArabic` function filters aggressively - use Arabic text in tests!

### 3. Filter Hook

Create `src/app/new/use-new-filters.ts` following the shamela/ketab pattern:
- Read filters from `useSearchParams()`
- Update URL with `router.replace()`
- Hash-based scroll-to-id

### 4. UI Components

```text
src/app/new/
├── page.tsx           # Main page with DataGate, tabs, VirtualizedList
├── page-row.tsx       # Row component for pages
├── title-row.tsx      # Row component for titles
├── table-header.tsx   # Filter inputs
├── toolbar.tsx        # Action buttons (save, download, reset, segmentation)
└── use-new-filters.ts # URL-based filtering
```

### 5. Creating a New Route (Continued)

| Issue | Solution |
|-------|----------|
| Line breaks not showing | Add `whitespace-pre-wrap` class to content containers |
| EditableHTML not preserving newlines | Use CSS `whitespace-pre-wrap` |
| Duplicate columns (ID/Page) | Consolidate into single clickable column |
| Non-Arabic tests failing sanitization | Use realistic Arabic content in tests |
| `IndexedExcerpt` requires vol/vp | Set `vol: 0, vp: 0` for non-book content |
| Tatweel Removal | Use simple regex `/\u0640/g` to preserve line breaks instead of aggressive libraries |

### 6. Prompt Management System

Prompts are managed externally via the `wobble-bibble` library.

- **Stacking Logic**: The application uses a strategy where prompts are combined to provide context. The foundation ID is typically `master_prompt`.
- **Placeholder Replacement**: Prompts support a `{{book}}` tag. Use `formatExcerptsForPrompt(excerpts, prompt, bookTitle)` which handles the replacement logic (replacing with `bookTitle` or fallback "this book").
- **Filtering**: When displaying prompt selectors, always filter out the `master_prompt` as it is typically used as a global foundation for other prompts rather than a standalone selection.

### 7. DOM Performance Patterns (e.g., 40k+ Items)

When dealing with very large datasets (like 40,000 excerpt IDs in the Translation Picker):

1. **Limit Active DOM nodes**: Do not render thousands of buttons/interactive elements at once. Use a rendering cap (e.g., `MAX_VISIBLE_PILLS = 500`) even inside scrollable areas.
2. **React.memo is mandatory**: Any repeated item component (Pill, Row) MUST be wrapped in `React.memo`.
3. **Memoize Event Handlers**: Wrap all handlers passed to list items in `useCallback`.
4. **Avoid Render-Heavy state**: Don't calculate 40k strings in a render loop. Use `useMemo` for derived formatting and only compute for active selection.

### 8. Lessons Learned

| Issue | Solution |
|-------|----------|
| Line breaks not showing | Add `whitespace-pre-wrap` class to content containers |
| EditableHTML not preserving newlines | Use CSS `whitespace-pre-wrap` |
| Duplicate columns (ID/Page) | Consolidate into single clickable column |
| Non-Arabic tests failing sanitization | Use realistic Arabic content in tests |
| `IndexedExcerpt` requires vol/vp | Set `vol: 0, vp: 0` for non-book content |
| Tatweel Removal | Use simple regex `/\u0640/g` to preserve line breaks instead of aggressive libraries |
| Infinite Loop in Restore | Use `useRef` to store functional callbacks in custom hooks |
| Immer crashes on Set/Map | Call `enableMapSet()` at the top of the store file |
| Picker sluggish with 40k items | Cap DOM rendering nodes and use O(1) Map lookups for formatting |
| `write_to_file` creating empty files | Always verify file content after writing; sometimes large writes fail silently |
| Unrelated Build Errors | Distinguish between your changes and pre-existing breakage (e.g., missing files in other routes) |
| Concise Naming | Prefer short, clear component names (e.g., `PickerTab` vs `TranslationPickerTabDialog`) |
| Dialog Entry Points | Use a `defaultTab` prop to allow different buttons to open the same dialog to different states |
| `findExcerptIssues` Gaps | Refine gap detection (1-3 gaps) to ignore boundaries and long sequences (>3) |
| Virtualizer Jumps | Avoid `data.length` in `dataVersion` key to prevent remounts on middle deletions |
| Initial Scroll vs ScrollTo | `initialScrollTop` (pixel-based) is safer for remounts; `scrollToId` (key-based) can conflict |
| Icon Confirmations | Use visual cues (pulsing ring, icon swap) for small confirm buttons instead of text |
| Bulk Toasting | Condense multiple success/warning toasts into a single combined message for better UX |