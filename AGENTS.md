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
│   ├── api/                # API routes (translate, shamela, analytics)
│   ├── book/               # Book viewing and translation dialogs
│   ├── browse/             # Static browsable content pages
│   ├── excerpts/           # Excerpts, headings, footnotes management
│   ├── manuscript/         # Manuscript editing interface
│   ├── settings/           # API key and configuration management
│   ├── shamela/            # Shamela book editor
│   │   └── segmentation/   # Segmentation panel components
│   └── transcript/         # Audio transcript editing
├── components/             # Shared React components
│   ├── hooks/              # Custom React hooks
│   └── ui/                 # UI primitives (shadcn/ui style)
├── lib/                    # Utility functions and helpers
├── stores/                 # Zustand state management stores
│   ├── bookStore/          # Book compilation state (Kitab format)
│   ├── excerptsStore/      # Excerpts, headings, footnotes state
│   ├── manuscriptStore/    # Manuscript editing state
│   ├── patchStore/         # Page edit diffs for version control
│   ├── segmentationStore/  # Segmentation panel state (rules, patterns, replacements)
│   ├── settingsStore/      # App settings and API keys
│   ├── shamelaStore/       # Shamela book editing state
│   └── transcriptStore/    # Transcript editing state
├── test-utils/             # Testing utilities and helpers
└── types/                  # TypeScript type definitions
```

### State Management

We use **Zustand** with **Immer middleware** for immutable state updates:

```typescript
// Store pattern (see src/stores/excerptsStore/)
├── types.ts           # State and action type definitions
├── actions.ts         # Pure action functions (operate on state via Immer)
├── selectors.ts       # Memoized selectors for derived state
├── useExcerptsStore.ts # Zustand store with Immer middleware
└── *.test.ts          # Unit tests
```

**Key patterns:**
- Use `zustand/middleware/immer` for immutable updates (NOT `mutative`)
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

- **Hydration pattern**: Initialize with empty defaults, call `hydrate()` in `useEffect` to avoid SSR mismatch
- **Encryption**: API keys are base64-encoded before storing in localStorage
- **Settings**: Gemini API keys, Shamela API key/endpoint, quick substitutions

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
1. Captures data (like selected text) when dialog opens via `renderContent`
2. Lazily renders content only when opened
3. Passes data as props to the content component
4. Supports `onClose` callback for programmatic closing

**Dialog Sizing:**

For large dialogs that need to stretch horizontally, use `!max-w-[90vw]` to override the default max-width:

```tsx
// In your DialogContent component:
<DialogContent className="!max-w-[90vw] flex h-[85vh] w-[90vw] flex-col">
    {/* Dialog content */}
</DialogContent>
```

The `!` prefix applies `!important` to override ShadCN's default `sm:max-w-lg` constraint.

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
- **Bun test runner** with `happy-dom` environment
- **@testing-library/react** for component testing
- Tests live alongside source files: `component.tsx` → `component.test.tsx`

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

### API Routes

| Route | Method | Purpose |
|-------|--------|--------|
| `/api/shamela` | GET | Download book from Shamela (requires auth header) |
| `/api/translate` | POST | Translate text via Google Gemini |
| `/api/analytics` | POST | Record analytics events |
| `/api/rules` | GET | Fetch manuscript correction rules |

---

## Accessibility

- Provide meaningful `aria-label` attributes for buttons
- Use semantic HTML elements
- Ensure keyboard navigation works
- Test with screen readers when possible

---

## Code Style

- **Linting**: Biome (configured in `biome.json`)
- **Formatting**: Biome with 4-space indentation
- **Import order**: Sorted automatically

Run checks:
```bash
bunx biome check --apply .    # Lint and format
bun run build                  # TypeScript + production build
```

---

## Common Tasks

### Adding a New Store Action

1. Add type to `types.ts`
2. Implement pure function in `actions.ts`
3. Wire into store in `useXxxStore.ts`
4. Add tests in `actions.test.ts` and `useXxxStore.test.ts`

### Adding a New Component

1. Create `component-name.tsx` with props interface
2. Export with `React.memo` if expensive
3. Add `component-name.test.tsx` with mock setup
4. Import from parent and wire handlers

### Adding URL-Based State

See `src/app/excerpts/use-excerpt-filters.ts` for pattern:
- Read from `useSearchParams()`
- Update with `router.replace()`
- Apply side effects in `useEffect`

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

The segmentation panel (`src/app/shamela/segmentation/`) uses [flappa-doormal](https://github.com/ragaeeb/flappa-doormal) for pattern-based page segmentation.

**Store structure** (`src/stores/segmentationStore/types.ts`):
```typescript
type RuleConfig = {
    pattern: string;              // Original pattern (immutable)
    template: string | string[];  // Editable, can be array for merged rules
    patternType: 'lineStartsWith' | 'lineStartsAfter';
    fuzzy: boolean;               // Diacritic-insensitive matching
    pageStartGuard: boolean;      // Skip matches at page boundaries
    metaType: 'none' | 'book' | 'chapter';
    min?: number;                 // Minimum page number
};

type Replacement = {
    regex: string;       // Raw regex pattern
    replacement: string; // Replacement text
};

type TokenMapping = {
    token: string;  // e.g., "raqms"
    name: string;   // e.g., "num" → transforms {{raqms}} to {{raqms:num}}
};
```

**Panel tabs**:
- `PatternsTab`: Line-start pattern analysis with auto-detection
- `RulesTab`: Rule configuration with drag & drop, merge, and examples
- `ReplacementsTab`: Pre-processing regex replacements with live match counts
- `PreviewTab`: Live virtualized preview of segmentation results
- `JsonTab`: Raw JSON options editor

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

1. **Use Maps for O(1) lookup** instead of array `.find()` calls
2. **Single state update** - batch all changes into one `set()` call to minimize re-renders
3. **Build index maps upfront** before iterating

See `src/stores/excerptsStore/actions.ts` `applyBulkTranslations` for the pattern:

```typescript
// Build index maps for O(1) lookup
const excerptIndexMap = new Map<string, number>();
for (let i = 0; i < state.excerpts.length; i++) {
    excerptIndexMap.set(state.excerpts[i].id, i);
}

// Apply updates using O(1) lookups
for (const [id, text] of translationMap) {
    const index = excerptIndexMap.get(id);
    if (index !== undefined) {
        state.excerpts[index] = { ...state.excerpts[index], text };
    }
}
```

Parsing utilities for bulk data live in `@/lib/transform/excerpts.ts`.

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

- NEVER run "bun dev" and launch the app yourself in the browser. Always prompt the user to do it for testing.