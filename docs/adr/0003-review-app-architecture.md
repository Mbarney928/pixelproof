# 0003. A static, feature-sliced Vue review app

- Status: accepted
- Date: 2026-11-09

## Context

Reviewers need to look at many screenshots quickly and record decisions. Wherever CI produces the report
it must be easy to host, ideally as a plain artifact or a GitHub Pages site, with no server or accounts.

## Decision

- **Static app with hash routing.** Vue 3 + Vite, built with relative asset paths. It runs from any
  folder, including a downloaded CI artifact or a Pages sub-path, with no server rewrites.
- **Decisions stay in the browser until exported.** Pinia keeps decisions per run in `localStorage`. The
  CLI applies the exported `approvals.json`, so the baseline only ever changes through the CLI and review
  stays a read-only activity.
- **Server state vs client state.** TanStack Vue Query owns the report (fetch, cache, retry). Pinia owns
  only client state (decisions, theme). Filters live in the URL, so a filtered list can be shared and the
  back button works.
- **Feature-sliced layers** (`app → pages → widgets → features → entities → shared`), enforced by
  `eslint-plugin-boundaries`. A slice is imported only through its `index.ts`.
- **Everything is reachable without a mouse.** j/k/Esc navigate, a/r/u decide, 1–4 switch views, and the
  chart has a table view.

## Consequences

- Decisions made on one machine do not sync to another. Exporting the file is the hand-off, which suits a
  pull-request workflow.
- Hash URLs are less pretty than history routes. That is acceptable for a tool, and it is what makes
  zero-config hosting possible.
