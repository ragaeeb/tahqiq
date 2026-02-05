# PR Title: chore: resolve typescript errors and synchronize test mocks with updated types

## Description

This PR systematically addresses a series of TypeScript compilation errors and type mismatches distributed across the codebase. The changes primarily focus on aligning unit test mock data with evolved type definitions, ensuring a clean build and reliable testing environment.

## Key Improvements

### 1. Excerpts Store Alignment (`src/stores/excerptsStore`)
- **Type Compliance**: Updated `Excerpt`, `Heading`, and `Footnote` mock objects in all test suites (`actions`, `selectors`, `useExcerptsStore`) to include mandatory `translator` (ID) and `lastUpdatedAt` (timestamp) properties.
- **Store Initialization**: Populated missing required fields in `Compilation` data structures used in tests, including `contractVersion`, `createdAt`, `lastUpdatedAt`, and `postProcessingApps`.
- **Options Refactoring**: Added the `minWordsPerSegment` property to `BookSegmentationOptions` in mock states.
- **Interface Completeness**: Stubbed out missing action methods in `selectors.test.ts` (e.g., `applyBulkTranslations`, `save`, `resetSentToLlm`) to fully satisfy the `ExcerptsState` interface.

### 2. Transcript Store and Rendering (`src/app/transcript`)
- **Segment Structure**: Synchronized mock segments in `transcript-toolbar.test.tsx`, `search-dialog.test.tsx`, and `page.test.tsx` with the latest `flappa-doormal` / `paragrafs` requirements by adding `tokens` and `end` timestamps.
- **Transcript Actions**: Resolved type incompatibility in `TranscriptState` mocks within `actions.test.ts`.

### 3. Shamela Store Fixes (`src/stores/shamelaStore`)
- **Type Safety**: Changed `version` property from `number` to `string` in `actions.test.ts` to match the state core definition.
- **Schema Cleanup**: Removed the non-existent `level` property from `ShamelaTitle` mocks in `use-shamela-filters.test.ts`.

### 4. Segmentation Logic & UI Refinement
- **UI Simplification**: Replaced manual debug property rendering in `PreviewTab.tsx` with the more robust `getSegmentDebugReason` utility from `flappa-doormal`.
- **Type Definitions**: Moved `DebugMeta` definition to a local export in `src/lib/segmentation.ts` to bypass import resolution issues from external compiled packages.
- **Legacy Compatibility**: Fixed incorrect `Page` type imports in `replace.test.ts`.

### 5. General Infrastructure
- **Book State**: Added missing `isHighlighterEnabled` property to `BookStateCore` mocks in volume formatting tests.
- **Manuscript View**: Fixed a type-casting issue in `table-body.test.tsx` related to `memo` components and Jest mock implementations.
- **Performance Logging**: Added temporary performance timing to `ErrorsTab.tsx` for validation (can be removed before merge or kept for observability).

## Verification Results

- **Type Check**: `bunx tsc --noEmit` completes successfully (0 errors).
- **Unit Tests**: All 489 tests passed.
  - `Ran 489 tests across 53 files. [862.00ms]`
