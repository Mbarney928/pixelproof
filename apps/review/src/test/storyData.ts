import type { ReportEntry } from '@pixelproof/core/schema';

import { sampleReport } from './fixtures';

/** A changed entry whose images are the synthetic fixtures served from Storybook's static dir. */
export function storyEntry(overrides: Partial<ReportEntry> = {}): ReportEntry {
  return {
    id: 'settings-card',
    name: 'Settings card',
    group: 'Components',
    viewport: { name: 'card', width: 480, height: 300 },
    theme: 'light',
    url: 'http://127.0.0.1:6006/iframe.html?id=settings-card',
    status: 'changed',
    severity: 'moderate',
    width: 480,
    height: 300,
    images: {
      baseline: 'baseline/settings-card.png',
      current: 'current/settings-card.png',
      diff: 'diff/settings-card.png',
    },
    diff: {
      pixels: 6192,
      ratio: 0.043,
      ssim: 0.984,
      sizeChanged: false,
      regions: [
        { x: 48, y: 220, width: 144, height: 32, pixels: 4608 },
        { x: 360, y: 92, width: 72, height: 22, pixels: 1584 },
      ],
    },
    ...overrides,
  };
}

export { sampleReport };
