import { describe, expect, it } from 'vitest';

import { parseConfig } from './config.js';
import { globToRegExp, resolveJobs } from './targets.js';

const index = {
  v: 5,
  entries: {
    'buttons--primary': {
      id: 'buttons--primary',
      title: 'Components/Button',
      name: 'Primary',
      type: 'story',
    },
    'buttons--docs': { id: 'buttons--docs', title: 'Components/Button', name: 'Docs', type: 'docs' },
    'badge--warning': { id: 'badge--warning', title: 'Components/Badge', name: 'Warning', type: 'story' },
    'pages--checkout': { id: 'pages--checkout', title: 'Pages/Checkout', name: 'Default', type: 'story' },
  },
};

describe('globToRegExp', () => {
  it('distinguishes * from **', () => {
    expect(globToRegExp('Components/*').test('Components/Button')).toBe(true);
    expect(globToRegExp('Components/*').test('Components/Button/Primary')).toBe(false);
    expect(globToRegExp('Components/**').test('Components/Button/Primary')).toBe(true);
    expect(globToRegExp('**/Primary').test('components/button/primary')).toBe(true);
    expect(globToRegExp('a.b').test('axb')).toBe(false);
  });
});

describe('resolveJobs', () => {
  it('multiplies URL targets by viewports and themes with merged masks', async () => {
    const config = parseConfig({
      baseUrl: 'http://127.0.0.1:4310',
      mask: ['.clock'],
      targets: { urls: [{ name: 'Pricing', url: '/pricing.html', mask: ['.avatar'], waitFor: '#ready' }] },
      viewports: [
        { name: 'mobile', width: 375, height: 812 },
        { name: 'desktop', width: 1280, height: 800 },
      ],
      themes: ['light', 'dark'],
    });
    const jobs = await resolveJobs(config);
    expect(jobs.map((j) => j.id)).toEqual([
      'pages-pricing--mobile--light',
      'pages-pricing--mobile--dark',
      'pages-pricing--desktop--light',
      'pages-pricing--desktop--dark',
    ]);
    expect(jobs[0]).toMatchObject({
      url: 'http://127.0.0.1:4310/pricing.html',
      mask: ['.clock', '.avatar'],
      waitFor: '#ready',
    });
  });

  it('reads stories from a Storybook index, skipping docs and honouring filters and theme globals', async () => {
    const requested: string[] = [];
    const config = parseConfig({
      targets: {
        storybook: {
          url: 'http://127.0.0.1:6006',
          include: ['Components/**'],
          exclude: ['**/Warning'],
          themeGlobal: 'theme',
        },
      },
      themes: ['dark'],
    });
    const jobs = await resolveJobs(config, (url) => {
      requested.push(url);
      return Promise.resolve(index);
    });
    expect(requested).toEqual(['http://127.0.0.1:6006/index.json']);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      id: 'components-button-primary--desktop--dark',
      group: 'Components/Button',
      name: 'Primary',
      url: 'http://127.0.0.1:6006/iframe.html?id=buttons--primary&viewMode=story&globals=theme%3Adark',
    });
  });

  it('rejects an unreachable or malformed index and an empty selection', async () => {
    const config = parseConfig({
      targets: { storybook: { url: 'http://127.0.0.1:6006', include: ['Nothing/**'] } },
    });
    await expect(resolveJobs(config, () => Promise.reject(new Error('ECONNREFUSED')))).rejects.toThrow(
      /Could not load http:\/\/127.0.0.1:6006\/index.json: ECONNREFUSED/,
    );
    await expect(resolveJobs(config, () => Promise.resolve({ stories: [] }))).rejects.toThrow(
      /not a Storybook 7\+ index/,
    );
    await expect(resolveJobs(config, () => Promise.resolve(index))).rejects.toThrow(/No targets matched/);
  });

  it('refuses two targets that would overwrite each other', async () => {
    const config = parseConfig({
      targets: {
        urls: [
          { name: 'Home page', url: 'https://example.com/a' },
          { name: 'home-page', url: 'https://example.com/b' },
        ],
      },
    });
    await expect(resolveJobs(config)).rejects.toThrow(/map to the same snapshot id/);
  });
});
