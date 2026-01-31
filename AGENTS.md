# Tahqiq Agent Guidelines

Welcome! This document provides essential information for AI agents contributing to this repository.

## Quick Start

1. **Install dependencies**: `bun install`
2. **Run tests**: `bun test --coverage`
3. **Build for production**: `bun run build`
4. **Development server**: `bun run dev`

---

## Project Overview

Tahqiq is a Next.js-based application for managing and translating Islamic manuscripts and texts. It provides tools for manuscript processing, transcript management, excerpts organization, Shamela book editing, and static generation of browsable Islamic texts.

---

## Architecture

### Directory Structure

```text
src/
├── app/                    # Next.js App Router pages and components
│   ├── api/                # API routes (huggingface, analytics, rules)
│   ├── excerpts/           # Excerpts management
│   ├── manuscript/         # Manuscript editing
│   ├── shamela/            # Shamela book editor
│   ├── transcript/         # Audio transcript editing
│   └── web/                # Web content editor
├── components/             # Shared React components
│   ├── segmentation/       # Segmentation panel components
│   ├── hooks/              # Custom React hooks
│   └── ui/                 # UI primitives (shadcn/ui style)
├── lib/                    # Utility functions and helpers
├── stores/                 # Zustand state management stores
├── test-utils/             # Testing utilities
└── types/                  # TypeScript type definitions
```

### State Management

We use **Zustand** with **Immer middleware** for immutable state updates:

```typescript
// Store pattern (see src/stores/excerptsStore/)
├── types.ts           # State and action type definitions
├── actions.ts         # Pure action functions
├── actions.test.ts    # Unit tests for pure state logic
├── selectors.ts       # Memoized selectors for derived state
└── useExcerptsStore.ts # Zustand store with Immer middleware
```

**Key patterns:**
- Use `zustand/middleware/immer` for immutable updates
- **Immer + Map/Set**: Call `enableMapSet()` if using `Map` or `Set` in state
- Actions are pure functions that mutate draft state
- Selectors use `memoize-one` for performance

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

### ShadCN Components

**Always prefer ShadCN UI components from `@/components/ui/` over vanilla HTML elements** (Button, Input, Dialog, Select, etc.).

### Dialog Pattern

Use `DialogTriggerButton` from `@/components/ui/dialog-trigger` for lazy-loaded dialog content:

```tsx
<DialogTriggerButton
    renderContent={() => {
        const selectedText = getSelectedText(); // Capture at open time
        return <MyDialogContent initialValue={selectedText} onClose={() => setIsOpen(false)} />;
    }}
>
    Open Dialog
</DialogTriggerButton>
```

This pattern captures data when dialog opens and lazily renders content. For wide dialogs, use `!max-w-[90vw]` to override default constraints.

### Session Persistence (OPFS)

Common patterns for OPFS session storage are in `@/components/hooks/`:

```tsx
// Restore data from OPFS on mount
useSessionRestore(STORAGE_KEYS.excerpts, init, 'RestoreExcerptsFromSession');

// Save/download/reset handlers
const { handleSave, handleDownload, handleReset } = useStorageActions({
    storageKey: STORAGE_KEYS.excerpts,
    getExportData: () => mapStateToExport(useMyStore.getState()),
    reset: () => useMyStore.getState().reset(),
    analytics: { save: 'SaveExcerpts', download: 'DownloadExcerpts', reset: 'ResetExcerpts' },
});
```

**Storage keys** are centralized in `STORAGE_KEYS` constant in `@/lib/constants.ts`.

---

## Testing

### Test Framework
- **Bun test runner** with `happy-dom` environment
- **@testing-library/react** for component testing
- Tests live alongside source files: `component.tsx` → `component.test.tsx`

### Mocking Patterns

```tsx
import { describe, expect, it, mock } from 'bun:test';

// Mock external modules BEFORE imports
const mockFn = mock((_arg: any) => Promise.resolve({ data: 'test' }));
mock.module('@/lib/network', () => ({ myFunction: mockFn }));

// Import component AFTER mocks
const { myFunction } = await import('./my-module');
```

### Type Safety in Tests

Keep tests minimal by casting to `any` when strict types add unnecessary bloat:

```typescript
// Cast mock return values to any
mockDownloadFile.mockResolvedValueOnce(null as any);

// Cast partial objects to any for init calls
useMyStore.getState().init(partialData as any);

// Cast results when expect() has overload issues
expect(result as any).toEqual({ data: 'test' });
```

### Verifying No TypeScript Errors

After writing tests, always verify there are no TS errors:

```bash
# Check specific test files
bunx tsc --noEmit -p tsconfig.json 2>&1 | grep "your-file.test.ts"

# Or check all test files you wrote
bunx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "(file1\.test\.ts|file2\.test\.ts)"
```

### Running Tests

```bash
bun test                          # All tests
bun test src/stores/              # Store tests only
bun test --coverage               # With coverage
```

---

## Key Libraries

| Library | Purpose |
|---------|---------|
| `next` | App Router, SSG, API routes |
| `zustand` + `immer` | State management with immutable updates |
| `@tanstack/react-virtual` | Virtualized lists |
| `@huggingface/hub` | HuggingFace dataset downloads |
| `sonner` | Toast notifications |
| `memoize-one` | Selector memoization |
| `flappa-doormal` | Pattern-based segmentation logic |

---

## Code Style

- **Linting/Formatting**: Biome (configured in `biome.json`)
- **Import order**: Sorted automatically

```bash
bunx biome check --apply .    # Lint and format
bun run build                  # TypeScript + production build
```

---

## Important Rules

- **Unit Testing**: Use `it('should...')` convention for test descriptions
- **Package Manager**: NEVER use `npm`; always use `bun`
- **Dev Server**: NEVER run `bun dev` yourself; prompt the user to do so
- **Conciseness**: Respond concisely; don't over-explain

---

## Common Tasks

### Adding a New Store Action

1. Add type to `types.ts`
2. Implement pure function in `actions.ts`
3. Wire into store in `useXxxStore.ts`
4. Add tests in `actions.test.ts`

### Adding a New Component

1. Create `component-name.tsx` with props interface
2. Export with `React.memo` if expensive
3. Add `component-name.test.tsx` with mock setup

### Creating a New Route

See [docs/creating-new-routes.md](docs/creating-new-routes.md) for detailed patterns on creating routes similar to `/shamela`, `/ketab`, or `/web`.

---

## Performance Tips

1. Use `key` props to force component remount when needed
2. Memoize expensive selectors
3. Use virtualization for lists > 100 items
4. Prefer `defaultValue` over controlled inputs when possible
5. For large datasets (40k+ items): limit DOM nodes, use `React.memo`, build `Map` lookups

---

## Lessons Learned

| Issue | Solution |
|-------|----------|
| `write_to_file` creating empty files | Verify file content after writing; large writes can fail silently |
| Unrelated Build Errors | Distinguish between your changes and pre-existing breakage |
| Concise Naming | Prefer short, clear component names (e.g., `PickerTab` vs `TranslationPickerTabDialog`) |
| Immer crashes on Set/Map | Call `enableMapSet()` at the top of the store file |
| Infinite Loop in hooks | Use `useRef` to store functional callbacks |

---

Following these practices keeps the codebase maintainable and test-friendly for all contributors.