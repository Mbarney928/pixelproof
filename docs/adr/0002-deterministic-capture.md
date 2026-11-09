# 0002. Deterministic capture before clever diffing

- Status: accepted
- Date: 2026-11-09

## Context

Visual tests fail people in one way above all: flaky diffs. A blinking caret, a late web font, an animation
caught mid-frame or a different scrollbar makes every run "changed". Teams then raise the tolerance until real
regressions slip through, or they turn the suite off.

## Decision

Remove noise at the source and only then compare:

- Each job gets a fresh browser context with a fixed viewport, `deviceScaleFactor: 1`, color scheme,
  `reducedMotion: 'reduce'`, `en-US` locale and UTC timezone.
- Chromium runs with flags that pin text and color rendering (`--font-render-hinting=none`,
  `--force-color-profile=srgb`, `--disable-lcd-text`, and others).
- Injected CSS zeroes animations and transitions and hides carets and scrollbars. The page waits for
  `document.fonts.ready` and decodes every image, including lazy ones.
- A screenshot is kept only when two consecutive captures are byte-identical, up to `stability.attempts`.
  A snapshot that never settles is flagged as possibly flaky instead of silently compared.
- Dynamic content (clocks, avatars) is masked with a solid color in both images.

Diffing stays conservative: pixelmatch with anti-aliasing detection, plus SSIM and changed-region clustering
to rank what changed, not to hide it.

## Consequences

- Baselines are only comparable on the same OS and browser build. CI is the source of truth for baselines.
  Local runs are for iteration.
- CI enforces this. The e2e job captures all 80 Storybook snapshots twice, and any difference fails the build.
