# 0001. One versioned report contract, validated on both sides

- Status: accepted
- Date: 2026-11-09

## Context

The CLI writes a report and a separate static web app reads it. They ship together today, but a report
produced by one version may be opened by another (an old CI artifact, a newer review app). The review app
also loads the report over the network, and `?report=` lets anyone choose which file it loads.

## Decision

- `packages/core/src/schema.ts` defines the report, approvals and snapshot ids once with zod. The CLI
  validates what it writes and the review app validates what it reads.
- The schema lives behind a separate `@pixelproof/core/schema` export that depends only on zod, so the
  browser bundle never pulls in `pngjs` or Node built-ins.
- Every document carries `version: 1`. A different version is rejected with a clear message rather than
  half-rendered.
- Image paths must match `^(baseline|current|diff|thumb)/[a-z0-9-]+\.png$`, and `?report=` accepts only
  relative `.json` paths inside the app's own folder. A crafted report cannot point the app at another
  origin or walk out of the report folder.
- Approvals exported by the review app carry the `runId` they were made against, and
  `pixelproof approve --from` refuses a file from a different run.

## Consequences

- Breaking changes to the format need a version bump and a migration, which is the intended friction.
- Validating a large report costs a few milliseconds in the browser, which is negligible next to the images.
- Stale approvals can never promote screenshots the reviewer did not see.
