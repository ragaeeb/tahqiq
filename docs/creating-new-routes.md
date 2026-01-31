# Creating a New Route (like /web)

When creating a new route similar to existing ones (shamela, ketab, web), follow this pattern.

## 1. Store Layer (TDD)

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

## 2. Transform Layer

Data transformation logic should be implemented in specialized utility files in `src/lib/` (e.g., `textUtils.ts`, `segmentation.ts`, `legacy.ts`). Write unit tests for all transformation logic.

**Note:** The `sanitizeArabic` function filters aggressively - use Arabic text in tests!

## 3. Filter Hook

Create `src/app/new/use-new-filters.ts` following the shamela/ketab pattern:
- Read filters from `useSearchParams()`
- Update URL with `router.replace()`
- Hash-based scroll-to-id

## 4. UI Components

```text
src/app/new/
├── page.tsx           # Main page with DataGate, tabs, VirtualizedList
├── page-row.tsx       # Row component for pages
├── title-row.tsx      # Row component for titles
├── table-header.tsx   # Filter inputs
├── toolbar.tsx        # Action buttons (save, download, reset, segmentation)
└── use-new-filters.ts # URL-based filtering
```

## 5. URL Hash Scrolling Pattern

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

## 6. Prompt Management System

Prompts are managed externally via the `wobble-bibble` library.

- **Stacking Logic**: The application uses a strategy where prompts are combined to provide context. The foundation ID is typically `master_prompt`.
- **Placeholder Replacement**: Prompts support a `{{book}}` tag. Use `formatExcerptsForPrompt(excerpts, prompt, bookTitle)` which handles the replacement logic (replacing with `bookTitle` or fallback "this book").
- **Filtering**: When displaying prompt selectors, always filter out the `master_prompt` as it is typically used as a global foundation for other prompts rather than a standalone selection.

## 7. DOM Performance Patterns (e.g., 40k+ Items)

When dealing with very large datasets (like 40,000 excerpt IDs in the Translation Picker):

1. **Limit Active DOM nodes**: Do not render thousands of buttons/interactive elements at once. Use a rendering cap (e.g., `MAX_VISIBLE_PILLS = 500`) even inside scrollable areas.
2. **React.memo is mandatory**: Any repeated item component (Pill, Row) MUST be wrapped in `React.memo`.
3. **Memoize Event Handlers**: Wrap all handlers passed to list items in `useCallback`.
4. **Avoid Render-Heavy state**: Don't calculate 40k strings in a render loop. Use `useMemo` for derived formatting and only compute for active selection.

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Line breaks not showing | Add `whitespace-pre-wrap` class to content containers |
| EditableHTML not preserving newlines | Use CSS `whitespace-pre-wrap` |
| Duplicate columns (ID/Page) | Consolidate into single clickable column |
| Non-Arabic tests failing sanitization | Use realistic Arabic content in tests |
| Tatweel Removal | Use simple regex `/\u0640/g` to preserve line breaks instead of aggressive libraries |
| Infinite Loop in Restore | Use `useRef` to store functional callbacks in custom hooks |
| Immer crashes on Set/Map | Call `enableMapSet()` at the top of the store file |
| Picker sluggish with 40k items | Cap DOM rendering nodes and use O(1) Map lookups for formatting |
| Virtualizer Jumps | Avoid `data.length` in `dataVersion` key to prevent remounts on middle deletions |
| Initial Scroll vs ScrollTo | `initialScrollTop` (pixel-based) is safer for remounts; `scrollToId` (key-based) can conflict |
| Bulk Toasting | Condense multiple success/warning toasts into a single combined message for better UX |
| Form Submit Hijacking | Explicitly set `type="button"` on buttons inside `<form>` to prevent accidental submission |
| HTML Table Structure | Wrap interactive elements in a `<td>` to avoid hydration errors where a `<div>` is a direct child of `<tr>` |
| Hover Z-Index | Use `hover:z-index` (e.g., `hover:z-30`) on table rows for visual priority |
| Virtualized List Resilience | Implement null checks in `getKey` and `renderRow` for transient `undefined` states |
| Multi-ID Filtering | Use comma-separated URL parameters and additive logic (`addIdsToFilter`) for non-destructive filtering |
