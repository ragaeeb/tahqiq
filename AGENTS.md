# Tahqiq Agent Guidelines

Welcome! Keep the following conventions in mind when contributing to this repository:

1. **Use Bun first.** Install dependencies with `bun install`, run checks with `bun test --coverage`, and verify production output with `bun run build` before opening a PR.
2. **Favor Testing Library for UI code.** New client component tests should rely on `@testing-library/react` plus the happy-dom environment configured in `bunfig.toml`. When external modules need isolation, prefer `mock.module` from `bun:test` instead of ad-hoc stubs.
3. **Preserve accessibility.** When creating or updating components, provide meaningful `aria-label`s or text so tests can target elements without brittle selectors.
4. **Respect path aliases.** Use the `@/` alias for imports that reach into `src/` to keep code navigation consistent.
5. **Keep documentation current.** Update `README.md` or related docs whenever you add commands, dependencies, or workflows that other contributors must follow.

Following these practices keeps the Bun-powered toolchain and the new DOM-focused tests reliable for everyone.
